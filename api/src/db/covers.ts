/** Сохраняем стабильные URL обложек для анкет, уже созданных сидом. */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

mkdirSync('public/seed', { recursive: true })
for (let n = 1; n <= 8; n += 1) {
  const photo = readFileSync(`api/assets/seed/${n}.webp`).toString('base64')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 432 432" width="432" height="432">
  <title>Демонстрационная обложка — цветы</title>
  <image width="432" height="432" href="data:image/webp;base64,${photo}"/>
</svg>
`
  writeFileSync(`public/seed/${n}.svg`, svg)
}
