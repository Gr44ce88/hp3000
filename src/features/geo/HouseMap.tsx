import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { addressLabel, type HouseAddress } from './metro'

export type MapListing = { id: string; name: string; address: HouseAddress }
export function HouseMap({
  items,
  onPick,
}: {
  items: MapListing[]
  onPick?: (id: string) => void
}) {
  const host = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!host.current || !items.length) return
    const map = L.map(host.current, { scrollWheelZoom: false })
    map.zoomControl.setPosition('bottomright')
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)
    const bounds = L.latLngBounds([])
    const groups = new Map<string, MapListing[]>()
    for (const item of items) {
      const key = [item.address.lat, item.address.lon].join(',')
      groups.set(key, [...(groups.get(key) ?? []), item])
    }
    for (const group of groups.values()) {
      const a = group[0]!.address
      const point = L.latLng(a.lat, a.lon)
      bounds.extend(point)
      const popup = document.createElement('div')
      const title = document.createElement('strong')
      title.textContent = addressLabel(a)
      popup.append(title)
      for (const item of group) {
        const el = document.createElement(onPick ? 'button' : 'p')
        el.textContent = item.name
        el.style.display = 'block'
        if (onPick) {
          el.style.textDecoration = 'underline'
          el.onclick = () => onPick(item.id)
        }
        popup.append(el)
      }
      L.marker(point, {
        title: addressLabel(a),
        alt: addressLabel(a),
        icon: L.divIcon({
          className: 'house-pin',
          html: '<span></span>',
          iconSize: [24, 30],
          iconAnchor: [12, 30],
        }),
      })
        .addTo(map)
        .bindPopup(popup, {maxHeight:130, maxWidth:230, autoPanPadding:[24,24]})
    }
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 17 })
    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(host.current)
    return () => {
      observer.disconnect()
      map.remove()
    }
  }, [items, onPick])
  return <div ref={host} className="house-map" aria-label="Карта адресов встреч" />
}
