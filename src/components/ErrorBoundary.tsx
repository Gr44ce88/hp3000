import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'

type Props = { children: ReactNode }
type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  private reset = (): void => {
    this.setState({ error: null })
  }

  render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="grid min-h-[60dvh] place-items-center px-6">
        <div className="w-full max-w-lg rounded-lg border border-line bg-surface-elevated p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-content">Что-то сломалось</h1>
          <p className="mt-2 text-sm text-content-muted">
            Экран упал на рендере. Детали — в консоли.
          </p>
          <pre className="mt-4 max-h-40 overflow-auto rounded-md bg-surface p-3 text-left text-xs text-content-muted">
            {error.message}
          </pre>
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={this.reset}>Попробовать снова</Button>
            <Button variant="secondary" onClick={() => location.reload()}>
              Перезагрузить
            </Button>
          </div>
        </div>
      </div>
    )
  }
}
