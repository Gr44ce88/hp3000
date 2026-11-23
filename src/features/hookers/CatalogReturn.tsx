import { Link, useLocation, useNavigate, type LinkProps } from 'react-router-dom'

export function CatalogReturn(props: Omit<LinkProps, 'to'>) {
  const location = useLocation()
  const navigate = useNavigate()
  const origin = location.state?.catalogPath
  const fromList = origin === '/' || origin === '/hookers'
  return (
    <Link
      {...props}
      to={(fromList ? origin : '/') + location.search}
      onClick={(event) => {
        if (
          fromList &&
          event.button === 0 &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.shiftKey &&
          !event.altKey
        ) {
          event.preventDefault()
          navigate(-1)
        }
      }}
    />
  )
}
