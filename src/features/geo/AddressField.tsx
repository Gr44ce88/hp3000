import { useRef, useState } from 'react'
import { apiClient } from '@/lib/api/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { addressLabel, metroLabel, type HouseAddress } from './metro'

export function AddressField({
  city,
  initial,
  selected,
  onChange,
}: {
  city: string
  initial?: HouseAddress | null
  selected: HouseAddress | null
  onChange: (item: HouseAddress | null) => void
}) {
  const [street, setStreet] = useState(initial?.street ?? '')
  const [house, setHouse] = useState(initial?.house ?? '')
  const [results, setResults] = useState<HouseAddress[]>([])
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const request = useRef(0)
  function invalidate() {
    request.current++
    onChange(null)
    setResults([])
    setMessage('')
    setBusy(false)
  }
  async function lookup() {
    const serial = ++request.current
    setBusy(true)
    setMessage('')
    setResults([])
    try {
      const { data } = await apiClient.post<{ items: HouseAddress[] }>(
        '/addresses/lookup',
        { city, street, house },
      )
      if (request.current !== serial) return
      setResults(data.items)
      if (!data.items.length)
        setMessage('Дом не найден. Уточните улицу и номер, включая корпус.')
    } catch (error) {
      if (request.current === serial)
        setMessage((error as Error).message || 'Не удалось найти дом.')
    } finally {
      if (request.current === serial) setBusy(false)
    }
  }
  return (
    <fieldset className="bg-mat space-y-3 rounded-lg p-4">
      <legend className="px-1 font-medium">Адрес встречи</legend>
      <p className="text-content-muted text-sm">
        Укажите улицу и дом. Найдите и подтвердите дом для расчёта ближайших станций.
      </p>
      <div className="grid grid-cols-[2fr_1fr] gap-2">
        <label>
          Улица
          <Input
            value={street}
            maxLength={140}
            placeholder="Тверская улица"
            onChange={(e) => {
              invalidate()
              setStreet(e.target.value)
            }}
          />
        </label>
        <label>
          Дом
          <Input
            value={house}
            maxLength={24}
            placeholder="13"
            onChange={(e) => {
              invalidate()
              setHouse(e.target.value)
            }}
          />
        </label>
      </div>
      {!selected && (
        <Button
          type="button"
          variant="secondary"
          disabled={busy || street.trim().length < 2 || !house.trim()}
          onClick={() => void lookup()}
        >
          {busy ? 'Ищем дом…' : 'Найти дом'}
        </Button>
      )}
      {results.length > 0 && !selected && (
        <div>
          <p className="text-sm">Подтвердите адрес</p>
          {results.map((item) => (
            <button
              className="block min-h-11 underline"
              type="button"
              key={item.id}
              onClick={() => onChange(item)}
            >
              {addressLabel(item)}
            </button>
          ))}
        </div>
      )}
      <p role="status" className="text-sm">
        {selected ? (
          <>
            Выбран дом · {addressLabel(selected)}
            <br />
            {selected.metroIds.length
              ? 'Метро рядом · ' + metroLabel(selected.metroIds)
              : 'В радиусе 5 км станций нет'}
          </>
        ) : (
          message
        )}
      </p>
      {selected && <a className="inline-block underline" target="_blank" rel="noreferrer"
        href={`https://yandex.ru/maps/?pt=${selected.lon},${selected.lat}&z=17`}>Проверить дом на карте</a>}
    </fieldset>
  )
}
