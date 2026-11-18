import { createHash, randomUUID, timingSafeEqual } from 'node:crypto'
import { Router } from 'express'
import { currentUser, requireAuth } from '../auth/middleware.ts'
import { config } from '../config.ts'
import { one, query } from '../db/pool.ts'
import { conflict, notFound } from '../http/errors.ts'
import { handle, parseBody } from '../http/respond.ts'
import { paymentSchema } from '../schemas.ts'
import { idOr404 } from '../http/ids.ts'
import { ApiError } from '../http/errors.ts'

export const paymentsRouter: Router = Router()

type PaymentRow = {
  id: string
  hooker_id: string
  user_id: string
  amount: number
  currency: string
  method: string
  status: 'pending' | 'paid' | 'cancelled'
  merchant_order_id: string
  created_at: Date
  paid_at: Date | null
}

const md5 = (value: string): string => createHash('md5').update(value).digest('hex')

const safeEqual = (a: string, b: string): boolean => {
  const left = Buffer.from(a, 'utf8')
  const right = Buffer.from(b, 'utf8')
  return left.length === right.length && timingSafeEqual(left, right)
}

const toView = (row: PaymentRow) => ({
  id: row.id,
  hookerId: row.hooker_id,
  amount: row.amount,
  currency: row.currency,
  method: row.method,
  status: row.status,
  createdAt: new Date(row.created_at).toISOString(),
  paidAt: row.paid_at ? new Date(row.paid_at).toISOString() : null,
})

/** Оплата публикации: создаём заявку и отдаём ссылку на форму FreeKassa. */
paymentsRouter.post(
  '/payments',
  requireAuth,
  handle(async (req, res) => {
    const user = currentUser(req)
    const input = parseBody(paymentSchema, req.body)
    const hookerId = idOr404(input.hookerId)

    const hooker = await one<{ id: string; owner_id: string | null; is_published: boolean }>(
      'select id, owner_id, is_published from hookers where id = $1',
      [hookerId],
    )
    if (!hooker) throw notFound()
    if (hooker.owner_id !== user.id) throw new ApiError(403, 'Это чужая анкета')
    if (hooker.is_published) throw conflict('Анкета уже опубликована')

    const active = await one<PaymentRow>(
      `select * from payments where hooker_id = $1 and status = 'pending'
       order by created_at desc limit 1`,
      [hooker.id],
    )

    const amount = config.publicationFee
    const currency = config.freekassa.currency
    const payment =
      active ??
      (
        await query<PaymentRow>(
          `insert into payments (hooker_id, user_id, amount, currency, method, merchant_order_id)
           values ($1, $2, $3, $4, $5, $6) returning *`,
          [hooker.id, user.id, amount, currency, input.method, `hp3k-${randomUUID()}`],
        )
      )[0]!

    const { merchantId, secret1, formUrl, currenciesByMethod } = config.freekassa
    if (!merchantId || !secret1) {
      res.status(201).json({ payment: toView(payment), paymentUrl: null })
      return
    }

    const orderAmount = payment.amount.toFixed(2)
    const sign = md5(`${merchantId}:${orderAmount}:${secret1}:${currency}:${payment.merchant_order_id}`)
    const params = new URLSearchParams({
      m: merchantId,
      oa: orderAmount,
      currency,
      o: payment.merchant_order_id,
      s: sign,
      i: currenciesByMethod[payment.method] ?? '',
      lang: 'ru',
      us_payment: payment.id,
    })

    res.status(201).json({ payment: toView(payment), paymentUrl: `${formUrl}?${params.toString()}` })
  }),
)

/** Оповещение FreeKassa об оплате. Отвечаем «YES» — иначе сервис будет повторять запрос. */
paymentsRouter.all(
  '/payments/freekassa/notify',
  handle(async (req, res) => {
    const payload = { ...(req.query as Record<string, string>), ...(req.body as object) }
    const merchantId = String(payload.MERCHANT_ID ?? '')
    const amount = String(payload.AMOUNT ?? '')
    const orderId = String(payload.MERCHANT_ORDER_ID ?? '')
    const sign = String(payload.SIGN ?? '')

    res.type('text/plain')

    if (config.freekassa.checkIp) {
      const ip = (req.header('x-real-ip') ?? req.ip ?? '').replace('::ffff:', '')
      if (!config.freekassa.allowedIps.includes(ip)) {
        res.send('bad ip')
        return
      }
    }

    if (!config.freekassa.secret2) {
      res.status(500).send('secret2 is not configured')
      return
    }

    const expected = md5(`${merchantId}:${amount}:${config.freekassa.secret2}:${orderId}`)
    if (!sign || !safeEqual(expected, sign.toLowerCase())) {
      res.send('bad sign')
      return
    }

    const payment = await one<PaymentRow>(
      'select * from payments where merchant_order_id = $1',
      [orderId],
    )
    if (!payment) {
      res.send('not found')
      return
    }

    if (payment.status === 'paid') {
      res.send('YES')
      return
    }

    if (Math.abs(Number(amount) - payment.amount) > 0.009) {
      res.send('bad amount')
      return
    }

    await query(
      `update payments
       set status = 'paid', paid_at = now(), intid = $2, payer_account = $3, commission = $4
       where id = $1 and status <> 'paid'`,
      [
        payment.id,
        payload.intid ? Number(payload.intid) : null,
        payload.payer_account ?? null,
        payload.commission ? Number(payload.commission) : null,
      ],
    )
    await query('update hookers set is_published = true where id = $1', [payment.hooker_id])

    res.send('YES')
  }),
)

/** Статус оплаты по анкете — только владельцу. */
paymentsRouter.get(
  '/payments/:hookerId',
  requireAuth,
  handle(async (req, res) => {
    const hookerId = idOr404(req.params.hookerId)
    const payment = await one<PaymentRow>(
      `select * from payments where hooker_id = $1 and user_id = $2
       order by created_at desc limit 1`,
      [hookerId, currentUser(req).id],
    )
    res.json({ payment: payment ? toView(payment) : null })
  }),
)

/** Локальная эмуляция вебхука: без ключей FreeKassa нечем проверить оплату. */
paymentsRouter.post(
  '/payments/:id/mock-paid',
  requireAuth,
  handle(async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
      throw new ApiError(403, 'В проде оплату подтверждает FreeKassa')
    }
    const id = idOr404(req.params.id)
    const payment = await one<PaymentRow>(
      'select * from payments where id = $1 and user_id = $2',
      [id, currentUser(req).id],
    )
    if (!payment) throw notFound()

    await query(`update payments set status = 'paid', paid_at = now() where id = $1`, [payment.id])
    await query('update hookers set is_published = true where id = $1', [payment.hooker_id])
    res.json({ payment: toView({ ...payment, status: 'paid', paid_at: new Date() }) })
  }),
)
