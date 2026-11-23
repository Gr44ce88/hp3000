import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'

export type PhotoGalleryProps = {
  photos: string[]
  mainPhoto?: string
  alt: string
  className?: string
}

/**
 * Галерея анкеты: большое главное фото, стрелки и миниатюры.
 * Клик по фото раскрывает его на весь экран, листается стрелками и Esc.
 */
export function PhotoGallery({ photos, mainPhoto, alt, className }: PhotoGalleryProps) {
  const ordered = mainPhoto ? [mainPhoto, ...photos.filter((url) => url !== mainPhoto)] : photos
  const [index, setIndex] = useState(0)
  const [zoomed, setZoomed] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)

  const count = ordered.length
  const current = ordered[index]

  const step = useCallback(
    (delta: number) => setIndex((value) => (count === 0 ? 0 : (value + delta + count) % count)),
    [count],
  )

  useEffect(() => {
    if (!zoomed) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setZoomed(false)
      if (event.key === 'ArrowRight') step(1)
      if (event.key === 'ArrowLeft') step(-1)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [zoomed, step])

  if (count === 0) {
    return (
      <div
        className={cn(
          'monogram grid aspect-[4/3] place-items-center rounded-lg bg-mat text-5xl font-medium text-content-muted/60 ring-1 ring-hairline',
          className,
        )}
      >
        {alt.slice(0, 1).toUpperCase()}
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="group relative overflow-hidden rounded-lg bg-mat ring-1 ring-hairline">
        <button
          type="button"
          onClick={() => setZoomed(true)}
          aria-label={`Увеличить фото ${index + 1} из ${count}`}
          className="block w-full cursor-zoom-in"
        >
          <img
            src={current}
            alt={alt}
            className="max-h-[70vh] min-h-[16rem] w-full object-cover"
          />
        </button>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Предыдущее фото"
              className="absolute top-1/2 left-2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white backdrop-blur transition-colors hover:bg-black/65"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Следующее фото"
              className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white backdrop-blur transition-colors hover:bg-black/65"
            >
              ›
            </button>
            <span className="absolute right-2 bottom-2 rounded-full bg-black/45 px-2 py-0.5 text-[11px] text-white tabular-nums backdrop-blur">
              {index + 1} / {count}
            </span>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {ordered.map((url, position) => (
            <button
              key={url}
              type="button"
              onClick={() => setIndex(position)}
              aria-pressed={position === index}
              aria-label={`Фото ${position + 1}`}
              className="size-16 shrink-0 overflow-hidden rounded-md ring-1 ring-hairline aria-pressed:ring-2 aria-pressed:ring-content/50"
            >
              <img src={url} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {zoomed && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Фото: ${alt}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setZoomed(false)}
        >
          <img
            src={current}
            alt={alt}
            className="max-h-full max-w-full object-contain"
            onClick={(event) => event.stopPropagation()}
          />

          <button
            ref={closeRef}
            type="button"
            onClick={() => setZoomed(false)}
            aria-label="Закрыть"
            className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-white/15 text-lg text-white backdrop-blur hover:bg-white/25"
          >
            ✕
          </button>

          {count > 1 && (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  step(-1)
                }}
                aria-label="Предыдущее фото"
                className="absolute top-1/2 left-3 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-2xl text-white backdrop-blur hover:bg-white/25"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  step(1)
                }}
                aria-label="Следующее фото"
                className="absolute top-1/2 right-3 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-2xl text-white backdrop-blur hover:bg-white/25"
              >
                ›
              </button>
              <span className="absolute bottom-4 text-xs text-white/80 tabular-nums">
                {index + 1} / {count}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  )
}
