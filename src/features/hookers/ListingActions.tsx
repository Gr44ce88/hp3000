import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { apiClient } from '@/lib/api/client'
import type { Hooker } from './types'
import { Freshness } from './Freshness'

export function ListingActions({ item }: { item: Hooker }) {
  const client = useQueryClient()
  const change = useMutation({
    mutationFn: (action: 'confirm' | 'pause' | 'resume') =>
      apiClient.post(
        '/hookers/' + item.id + '/status',
        action === 'confirm'
          ? {
              action,
              phone: item.phone,
              telegram: item.telegram || '',
              pricePerHour: item.pricePerHour,
            }
          : { action },
      ),
    onSettled: async () => {
      await Promise.all(
        [
          'my-hookers',
          'hooker',
          'hookers',
          'owner-listing',
          'stats',
          'history-local',
          'favorites',
        ].map((key) => client.invalidateQueries({ queryKey: [key] })),
      )
    },
  })
  return (
    <div className="border-hairline w-full space-y-2 border-t pt-2 text-sm">
      <p>
        {item.paused
          ? 'На паузе'
          : item.isPublished
            ? 'В каталоге'
            : 'Ожидает публикации'}{' '}
        · {item.phone}
        {item.telegram && ' · @' + item.telegram}
      </p>
      <Freshness at={item.confirmedAt} />
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={change.isPending}
          onClick={() => change.mutate('confirm')}
        >
          Подтвердить цену и контакт
        </Button>
        {item.isPublished && (
          <Button
            size="sm"
            variant="ghost"
            disabled={change.isPending}
            onClick={() => change.mutate(item.paused ? 'resume' : 'pause')}
          >
            {item.paused ? 'Вернуть в каталог' : 'Поставить на паузу'}
          </Button>
        )}
      </div>
      {change.isError && <p role="alert">{change.error.message}</p>}
    </div>
  )
}
