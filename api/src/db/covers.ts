/** Генерирует обложки-заглушки для сида: public/seed/N.svg */
import { mkdirSync, writeFileSync } from 'node:fs'

const TONES = [
  ['#02182b', '#777da7'],
  ['#232b2f', '#d7263d'],
  ['#777da7', '#e8e9f3'],
  ['#d7263d', '#02182b'],
  ['#02182b', '#d7263d'],
  ['#777da7', '#02182b'],
  ['#232b2f', '#e8e9f3'],
  ['#d7263d', '#232b2f'],
]

mkdirSync('public/seed', { recursive: true })

TONES.forEach(([from, to], index) => {
  const n = index + 1
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="600" height="800">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${from}"/>
      <stop offset="1" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="600" height="800" fill="url(#g)"/>
  <circle cx="470" cy="150" r="120" fill="#ffffff" opacity="0.08"/>
  <circle cx="120" cy="660" r="180" fill="#ffffff" opacity="0.06"/>
  <text x="50%" y="52%" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="72" font-weight="600" fill="#e8e9f3" opacity="0.92">hp3k</text>
  <text x="50%" y="58%" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="28" fill="#e8e9f3" opacity="0.6">фото ${n}</text>
</svg>
`
  writeFileSync(`public/seed/${n}.svg`, svg)
})

console.log(`Обложек сгенерировано: ${TONES.length}`)
