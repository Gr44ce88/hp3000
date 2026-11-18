import { apiClient } from '@/lib/api/client'

export type PaymentMethod = 'card' | 'sbp' | 'crypto'

export type Payment = {
  id: string
  hookerId: string
  amount: number
  currency: string
  method: PaymentMethod
  status: 'pending' | 'paid' | 'cancelled'
  createdAt: string
  paidAt: string | null
}

/** Создаёт заявку на публикацию и отдаёт ссылку на форму FreeKassa (null — ключи не заданы). */
export async function createPayment(
  hookerId: string,
  method: PaymentMethod,
): Promise<{ payment: Payment; paymentUrl: string | null }> {
  const { data } = await apiClient.post<{ payment: Payment; paymentUrl: string | null }>(
    '/payments',
    { hookerId, method },
  )
  return data
}

export async function fetchPayment(hookerId: string): Promise<Payment | null> {
  const { data } = await apiClient.get<{ payment: Payment | null }>(`/payments/${hookerId}`)
  return data.payment
}

/** Локальное подтверждение оплаты — работает только вне продакшена. */
export async function mockPay(paymentId: string): Promise<Payment> {
  const { data } = await apiClient.post<{ payment: Payment }>(`/payments/${paymentId}/mock-paid`)
  return data.payment
}
