import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { useSessionStore } from '@/features/auth/store'

const KEY = ['favorites'] as const

async function fetchFavoriteIds(signal?: AbortSignal): Promise<string[]> {
  const { data } = await apiClient.get<{ ids: string[] }>('/favorites', { signal })
  return data.ids
}

/** Избранное живёт на сервере; у анонима список пустой. */
export function useFavoriteIds() {
  const token = useSessionStore((state) => state.token)

  return useQuery({
    queryKey: [...KEY, token ?? 'anon'],
    queryFn: ({ signal }) => fetchFavoriteIds(signal),
    enabled: Boolean(token),
    staleTime: 30_000,
  })
}

export function useToggleFavorite() {
  const queryClient = useQueryClient()
  const token = useSessionStore((state) => state.token)

  return useMutation({
    mutationFn: async ({ id, favorite }: { id: string; favorite: boolean }) => {
      if (favorite) {
        await apiClient.delete(`/favorites/${id}`)
      } else {
        await apiClient.put(`/favorites/${id}`)
      }
      return { id, favorite }
    },
    onMutate: async ({ id, favorite }) => {
      if (!token) return
      const key = [...KEY, token]
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<string[]>(key) ?? []
      queryClient.setQueryData<string[]>(
        key,
        favorite ? previous.filter((item) => item !== id) : [id, ...previous],
      )
      return { previous, key }
    },
    onError: (_error, _vars, context) => {
      if (context) queryClient.setQueryData(context.key, context.previous)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: KEY })
    },
  })
}
