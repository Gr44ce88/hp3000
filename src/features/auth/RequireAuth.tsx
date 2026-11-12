import { useState } from 'react'
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useSessionStore } from '@/features/auth/store'

export function RequireAuth({ children }: { children: ReactNode }) {
  const token = useSessionStore((state) => state.token)
  const location = useLocation()
  const [to] = useState(() => location.pathname)

  if (!token) return <Navigate to="/auth" replace state={{ from: to }} />
  return <>{children}</>
}
