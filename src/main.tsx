import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppRouter } from '@/app/router'
import { env } from '@/lib/env'
import { queryClientConfig } from '@/lib/queryClient'
import { ensureDemoSession } from '@/features/auth/demo'
import '@/index.css'

const queryClient = new QueryClient(queryClientConfig)

async function bootstrap() {
  if (env.enableMocks) {
    const { worker } = await import('@/test/msw/browser')
    await worker.start({ onUnhandledFrame: 'bypass' })
  }

  await ensureDemoSession()

  const container = document.getElementById('root')
  if (!container) throw new Error('Не найден #root')

  createRoot(container).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <AppRouter />
      </QueryClientProvider>
    </StrictMode>,
  )
}

void bootstrap()
