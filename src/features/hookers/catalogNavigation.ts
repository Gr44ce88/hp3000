import { useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType, type Location } from 'react-router-dom'

let lastCatalog: { key: string; y: number } | undefined
export function mapLinkProps(location: Location) {
  return {
    to: '/map' + location.search,
    state: { catalogPath: location.pathname },
    onClick: () => {
      lastCatalog = { key: location.key, y: window.scrollY }
    },
  }
}

export function useCatalogPosition(ready: boolean) {
  const location = useLocation()
  const type = useNavigationType()
  const restored = useRef(false)
  useLayoutEffect(() => {
    if (!ready || restored.current || type !== 'POP' || lastCatalog?.key !== location.key)
      return
    const y = lastCatalog.y
    const frame = requestAnimationFrame(() => {
      window.scrollTo(0, y)
      restored.current = true
    })
    return () => cancelAnimationFrame(frame)
  }, [ready, location.key, type])
}
