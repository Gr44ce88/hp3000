import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { copyText } from '@/lib/clipboard'

export function Contact({ phone, telegram }: { phone: string; telegram?: string }) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const tel = 'tel:' + phone.replace(/[^+\d]/g, '')
  const primary =
    'inline-flex min-h-11 items-center rounded-full bg-accent px-5 font-medium text-white'
  return (
    <div className="my-3 space-y-2">
      {telegram ? (
        <button className={primary} aria-expanded={open} onClick={() => setOpen(!open)}>
          Связаться
        </button>
      ) : (
        <a href={tel} className={primary}>
          Связаться · позвонить
        </a>
      )}
      {telegram && open && (
        <div className="bg-mat flex flex-wrap gap-3 rounded-lg p-3">
          <a className="underline" href={tel}>
            Позвонить
          </a>
          <a
            className="underline"
            href={'https://t.me/' + telegram}
            target="_blank"
            rel="noreferrer"
          >
            Telegram · @{telegram}
          </a>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span>{phone}</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={async () =>
            setMessage(
              (await copyText(phone))
                ? 'Номер скопирован'
                : 'Выделите номер для копирования',
            )
          }
        >
          Скопировать телефон
        </Button>
        <span role="status">{message}</span>
      </div>
    </div>
  )
}
