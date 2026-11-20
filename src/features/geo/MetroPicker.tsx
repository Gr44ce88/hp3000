import { useRef, useState } from 'react'
import { ChevronDown, Search, TrainFront, X } from 'lucide-react'
import { stationById, stations } from './metro'

const normalize = (s: string) => s.toLowerCase().replaceAll('ё', 'е').trim()

export function MetroPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (id: string) => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const selected = stationById.get(value)
  const matches = stations.filter(
    (s) =>
      normalize(s.name).includes(normalize(query)) ||
      normalize(s.line).includes(normalize(query)),
  )
  const choose = (id: string) => {
    onChange(id)
    dialog.current?.close()
  }
  return (
    <div className="metro-control">
      <span>Метро</span>
      <button
        className="metro-trigger"
        aria-haspopup="dialog"
        onClick={() => {
          setQuery('')
          dialog.current?.showModal()
          input.current?.focus()
        }}
      >
        <TrainFront size={17} />
        <span>{selected?.name || 'Все станции'}</span>
        <ChevronDown size={16} />
      </button>
      <dialog
        ref={dialog}
        onKeyDown={event => {
          if (event.key === 'Escape') {
            event.preventDefault()
            dialog.current?.close()
          }
        }}
        className="station-sheet"
        aria-labelledby="station-title"
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current.close()
        }}
      >
        <div className="station-inner">
          <header>
            <h2 id="station-title">Станция метро</h2>
            <button
              type="button"
              aria-label="Закрыть"
              onClick={() => dialog.current?.close()}
            >
              <X size={20} />
            </button>
          </header>
          <label className="station-search">
            <Search size={18} />
            <input
              ref={input}
              type="search"
              aria-label="Найти станцию или линию"
              placeholder="Станция или линия"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="station-list">
            <button type="button" aria-pressed={!value} onClick={() => choose('')}>
              Все станции
            </button>
            {matches.map((s) => (
              <button
                type="button"
                key={s.id}
                aria-pressed={s.id === value}
                onClick={() => choose(s.id)}
              >
                <i style={{ backgroundColor: s.color }} />
                <span>
                  {s.name}
                  <small>{s.line}</small>
                </span>
              </button>
            ))}
            {!matches.length && <p>Станция не найдена. Проверьте название.</p>}
          </div>
        </div>
      </dialog>
    </div>
  )
}
