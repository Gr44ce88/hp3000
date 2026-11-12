import { createHash, randomUUID } from 'node:crypto'
import cors from 'cors'
import express from 'express'

const PORT = Number(process.env.PORT ?? 8080)
const PAGE_LIMIT_MAX = 24
const CITIES = ['Москва']

const hash = (password, salt) => createHash('sha256').update(`${salt}:${password}`).digest('hex')

/** @type {{ id: string, email: string, name: string, salt: string, hash: string, createdAt: string }[]} */
const users = []
/** @type {Map<string, string>} token → userId */
const tokens = new Map()

let hookers = [
  {
    name: 'Аня',
    phone: '+7 915 100-10-01',
    age: 24,
    city: 'Москва',
    district: 'Пресня',
    region: 'Москва и область',
    height: 170,
    pricePerHour: 5000,
    services: ['Классика', 'GFE', 'Массаж'],
    about: 'Спокойная, без спешки. Встречаюсь в квартире у метро, душ есть.',
    rating: 4.8,
    reviewsCount: 12,
    isNew: false,
  },
  {
    name: 'Милана',
    phone: '+7 915 100-10-02',
    age: 27,
    city: 'Москва',
    district: 'Хамовники',
    region: 'Москва и область',
    height: 176,
    pricePerHour: 3500,
    services: ['Классика', 'Тантрический массаж'],
    about: 'Модельная внешность, разговариваю на английском.',
    rating: 4.5,
    reviewsCount: 4,
    isNew: false,
  },
  {
    name: 'Кира',
    phone: '+7 915 100-10-03',
    age: 22,
    city: 'Химки',
    district: 'Левобережный',
    region: 'Московская область',
    height: 165,
    pricePerHour: 2800,
    services: ['Классика'],
    about: 'Первая анкета, работаю недавно.',
    rating: 5,
    reviewsCount: 27,
    isNew: true,
  },
  {
    name: 'Ева',
    phone: '+7 915 100-10-04',
    age: 31,
    city: 'Москва',
    district: 'Сити',
    region: 'Москва и область',
    height: 168,
    pricePerHour: 9000,
    services: ['Классика', 'GFE', 'Ужин'],
    about: 'Выезд в отель, сопровождаю на мероприятия.',
    rating: 4.2,
    reviewsCount: 2,
    isNew: false,
  },
  {
    name: 'Лада',
    phone: '+7 915 100-10-05',
    age: 26,
    city: 'Москва',
    district: 'Басманный',
    region: 'Москва и область',
    height: 172,
    pricePerHour: 4500,
    services: ['Классика', 'Массаж'],
    about: 'Тихая квартира в центре, парковка во дворе.',
    rating: 4.7,
    reviewsCount: 8,
    isNew: false,
  },
  {
    name: 'Соня',
    phone: '+7 915 100-10-06',
    age: 20,
    city: 'Одинцово',
    district: 'Центр',
    region: 'Московская область',
    height: 160,
    pricePerHour: 2500,
    services: ['Классика'],
    about: 'Студентка, беру только до 22:00.',
    rating: 4.9,
    reviewsCount: 31,
    isNew: true,
  },
].map((item, index) => ({
  id: randomUUID(),
  ownerId: null,
  photos: [],
  reviews: [],
  kind: 'project',
  createdAt: new Date(Date.UTC(2026, 0, 4 + index * 2, 9, 12)).toISOString(),
  ...item,
}))

// Демо-аккаунт: в дев-режиме клиент входит под ним автоматически.
const demoId = randomUUID()
{
  const salt = randomUUID()
  users.push({
    id: demoId,
    email: 'demo@hookers.local',
    name: 'Аня',
    phone: '+7 900 000-00-00',
    avatarUrl: '',
    history: [],
    salt,
    hash: hash('demo12345', salt),
    createdAt: new Date().toISOString(),
    demo: true,
  })
  hookers[0].ownerId = demoId
  hookers[1].ownerId = demoId
  hookers[2].ownerId = demoId
}

const app = express()

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }))
app.use(express.json({ limit: '256kb' }))

app.use((req, _res, next) => {
  if (req.path !== '/api/health') {
    console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`)
  }
  next()
})

const publicUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  phone: user.phone ?? '',
  avatarUrl: user.avatarUrl ?? '',
})

const notFound = (res) => res.status(404).json({ message: 'Не найдено' })
const unauthorized = (res) => res.status(401).json({ message: 'Нужна авторизация' })

function currentUser(req) {
  const header = req.header('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  const userId = tokens.get(token)
  return userId ? users.find((user) => user.id === userId) ?? null : null
}

function requireAuth(req, res, next) {
  const user = currentUser(req)
  if (!user) return unauthorized(res)
  req.user = user
  next()
}

function validateListing(body) {
  const errors = {}
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const city = typeof body?.city === 'string' ? body.city.trim() : ''
  const region = typeof body?.region === 'string' ? body.region.trim() : ''
  const phone = typeof body?.phone === 'string' ? body.phone.trim() : ''
  const age = Number(body?.age)
  const height = Number(body?.height)
  const pricePerHour = Number(body?.pricePerHour)
  const services = Array.isArray(body?.services)
    ? body.services.filter((item) => typeof item === 'string').slice(0, 10)
    : []
  const about = typeof body?.about === 'string' ? body.about.trim() : ''

  if (name.length < 2 || name.length > 60) errors.name = 'Имя: от 2 до 60 символов'
  if (!Number.isInteger(age) || age < 18 || age > 80) errors.age = 'Возраст: 18–80'
  if (!CITIES.includes(city)) errors.city = `Город: один из ${CITIES.join(', ')}`
  if (region.length < 2 || region.length > 60) errors.region = 'Регион: от 2 до 60 символов'
  if (!/^[+\d][\d\s()-]{9,18}$/.test(phone)) errors.phone = 'Телефон: +7 900 000-00-00'
  if (!Number.isInteger(height) || height < 140 || height > 210) errors.height = 'Рост: 140–210 см'
  if (!Number.isInteger(pricePerHour) || pricePerHour < 1) errors.pricePerHour = 'Цена: целое число больше нуля'
  if (about.length > 255) errors.about = 'Описание: не больше 255 символов'

  return { errors, value: { name, age, city, region, phone, height, pricePerHour, services, about } }
}

const publicView = (item) => ({
  id: item.id,
  name: item.name,
  age: item.age,
  city: item.city,
  district: item.district ?? '',
  region: item.region ?? '',
  phone: item.phone ?? '',
  height: item.height,
  pricePerHour: item.pricePerHour,
  services: item.services ?? [],
  about: item.about ?? '',
  rating: item.rating ?? 0,
  reviewsCount: item.reviewsCount ?? 0,
  photos: item.photos ?? [],
  isNew: Boolean(item.isNew),
  createdAt: item.createdAt,
  ownerId: item.ownerId,
})

// ——— авторизация ———

app.post('/api/auth/register', (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase()
  const password = String(req.body?.password ?? '')
  const name = String(req.body?.name ?? '').trim()

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(422).json({ message: 'Некорректный e-mail', errors: { email: 'Проверьте адрес' } })
  }
  if (password.length < 8) {
    return res.status(422).json({ message: 'Короткий пароль', errors: { password: 'Минимум 8 символов' } })
  }
  if (name.length < 2) {
    return res.status(422).json({ message: 'Короткое имя', errors: { name: 'Минимум 2 символа' } })
  }
  if (users.some((user) => user.email === email)) {
    return res.status(409).json({ message: 'Такой e-mail уже занят' })
  }

  const salt = randomUUID()
  const user = {
    id: randomUUID(),
    email,
    name,
    phone: '',
    avatarUrl: '',
    history: [],
    salt,
    hash: hash(password, salt),
    createdAt: new Date().toISOString(),
  }
  users.push(user)

  const token = randomUUID()
  tokens.set(token, user.id)
  res.status(201).json({ token, user: publicUser(user) })
})

app.post('/api/auth/login', (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase()
  const password = String(req.body?.password ?? '')
  const user = users.find((entry) => entry.email === email)

  if (!user || hash(password, user.salt) !== user.hash) {
    return res.status(401).json({ message: 'Неверная почта или пароль' })
  }

  const token = randomUUID()
  tokens.set(token, user.id)
  res.json({ token, user: publicUser(user) })
})

app.post('/api/auth/demo', (_req, res) => {
  const user = users.find((entry) => entry.demo)
  if (!user) return res.status(503).json({ message: 'Демо-аккаунт не заведён' })
  const token = randomUUID()
  tokens.set(token, user.id)
  res.json({ token, user: publicUser(user) })
})

app.get('/api/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) })
})

app.patch('/api/me', requireAuth, (req, res) => {
  const errors = {}
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : req.user.name
  const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : req.user.phone
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : req.user.email

  if (name.length < 2 || name.length > 60) errors.name = 'Имя: от 2 до 60 символов'
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.email = 'Некорректный e-mail'
  if (phone && !/^[+\d][\d\s()-]{8,18}$/.test(phone)) errors.phone = 'Телефон: цифры, пробелы, +() и дефис'
  if (users.some((entry) => entry.email === email && entry.id !== req.user.id)) {
    errors.email = 'Адрес занят другим аккаунтом'
  }
  if (Object.keys(errors).length > 0) {
    return res.status(422).json({ message: 'Проверьте поля', errors })
  }

  Object.assign(req.user, { name, phone, email })
  res.json({ user: publicUser(req.user) })
})

app.get('/api/me/history', requireAuth, (req, res) => {
  const items = req.user.history
    .map((entry) => {
      const hooker = hookers.find((candidate) => candidate.id === entry.id)
      return hooker ? { ...publicView(hooker), viewedAt: entry.at } : null
    })
    .filter(Boolean)
    .slice(0, 20)
  res.json({ items, total: items.length })
})

app.get('/api/me/reviews', requireAuth, (req, res) => {
  const items = []
  for (const hooker of hookers) {
    for (const review of hooker.reviews) {
      if (review.authorId === req.user.id) {
        items.push({ ...review, hookerId: hooker.id, hookerName: hooker.name })
      }
    }
  }
  items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  res.json({ items, total: items.length })
})

// ——— каталог ———

app.get('/api/hookers', (req, res) => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : ''
  const city = typeof req.query.city === 'string' ? req.query.city : ''
  const ids = typeof req.query.ids === 'string' ? req.query.ids.split(',').filter(Boolean) : []
  const minPrice = Number(req.query.minPrice ?? 0)
  const maxPrice = Number(req.query.maxPrice ?? 0)
  const sort = String(req.query.sort ?? 'price-asc')
  const page = Math.max(1, Number(req.query.page ?? 1))
  const limit = Math.min(PAGE_LIMIT_MAX, Math.max(1, Number(req.query.limit ?? 12)))

  let items = hookers
  if (query) {
    items = items.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.city.toLowerCase().includes(query) ||
        (item.district ?? '').toLowerCase().includes(query),
    )
  }
  if (city) items = items.filter((item) => item.city === city)
  if (ids.length > 0) items = items.filter((item) => ids.includes(item.id))
  if (minPrice > 0) items = items.filter((item) => item.pricePerHour >= minPrice)
  if (maxPrice > 0) items = items.filter((item) => item.pricePerHour <= maxPrice)

  const comparators = {
    'price-asc': (a, b) => a.pricePerHour - b.pricePerHour,
    'price-desc': (a, b) => b.pricePerHour - a.pricePerHour,
    'age-asc': (a, b) => a.age - b.age,
    'rating-desc': (a, b) => b.rating - a.rating,
    'new-desc': (a, b) => b.createdAt.localeCompare(a.createdAt),
  }
  items = [...items].sort(comparators[sort] ?? comparators['price-asc'])

  const total = items.length
  const start = (page - 1) * limit
  res.json({
    items: items.slice(start, start + limit).map(publicView),
    total,
    page,
    limit,
    hasMore: start + limit < total,
    cities: CITIES,
  })
})

app.get('/api/hookers/:id', (req, res) => {
  const item = hookers.find((entry) => entry.id === req.params.id)
  if (!item) return notFound(res)

  const user = currentUser(req)
  if (user && item.ownerId !== user.id) {
    user.history = [{ id: item.id, at: new Date().toISOString() }, ...user.history.filter((entry) => entry.id !== item.id)].slice(0, 30)
  }

  res.json(publicView(item))
})

app.post('/api/hookers', requireAuth, (req, res) => {
  const { errors, value } = validateListing(req.body)
  if (Object.keys(errors).length > 0) {
    return res.status(422).json({ message: 'Проверьте поля', errors })
  }

  const created = {
    id: randomUUID(),
    ownerId: req.user.id,
    photos: [],
    reviews: [],
    rating: 0,
    reviewsCount: 0,
    isNew: true,
    district: '',
    kind: 'project',
    createdAt: new Date().toISOString(),
    ...value,
  }
  hookers = [created, ...hookers]
  res.status(201).json(publicView(created))
})

app.patch('/api/hookers/:id', requireAuth, (req, res) => {
  const item = hookers.find((entry) => entry.id === req.params.id)
  if (!item) return notFound(res)
  if (item.ownerId && item.ownerId !== req.user.id) {
    return res.status(403).json({ message: 'Это чужая анкета' })
  }

  const { errors, value } = validateListing({ ...item, ...req.body })
  if (Object.keys(errors).length > 0) {
    return res.status(422).json({ message: 'Проверьте поля', errors })
  }

  Object.assign(item, value)
  res.json(publicView(item))
})

app.delete('/api/hookers/:id', requireAuth, (req, res) => {
  const item = hookers.find((entry) => entry.id === req.params.id)
  if (!item) return notFound(res)
  if (item.ownerId && item.ownerId !== req.user.id) {
    return res.status(403).json({ message: 'Это чужая анкета' })
  }

  hookers = hookers.filter((entry) => entry.id !== req.params.id)
  res.status(204).end()
})

app.get('/api/me/hookers', requireAuth, (req, res) => {
  const items = hookers
    .filter((item) => item.ownerId === req.user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  res.json({ items: items.map(publicView), total: items.length })
})

// ——— отзывы ———

app.get('/api/hookers/:id/reviews', (req, res) => {
  const item = hookers.find((entry) => entry.id === req.params.id)
  if (!item) return notFound(res)

  const sort = String(req.query.sort ?? 'new')
  const comparators = {
    new: (a, b) => b.createdAt.localeCompare(a.createdAt),
    old: (a, b) => a.createdAt.localeCompare(b.createdAt),
    best: (a, b) => b.rating - a.rating,
    worst: (a, b) => a.rating - b.rating,
  }
  const items = [...item.reviews].sort(comparators[sort] ?? comparators.new)
  res.json({ items, total: items.length })
})

app.post('/api/hookers/:id/reviews', requireAuth, (req, res) => {
  const item = hookers.find((entry) => entry.id === req.params.id)
  if (!item) return notFound(res)

  const rating = Number(req.body?.rating)
  const text = String(req.body?.text ?? '').trim()

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(422).json({ message: 'Оценка: целое 1–5', errors: { rating: 'От 1 до 5' } })
  }
  if (text.length < 10 || text.length > 1000) {
    return res.status(422).json({ message: 'Текст: 10–1000 символов', errors: { text: 'От 10 до 1000 символов' } })
  }

  if (item.reviews.some((entry) => entry.authorId === req.user.id)) {
    return res.status(409).json({ message: 'Вы уже оставили отзыв этой анкете' })
  }

  const review = {
    id: randomUUID(),
    authorId: req.user.id,
    author: req.user.name,
    rating,
    text,
    createdAt: new Date().toISOString(),
  }
  item.reviews = [review, ...item.reviews]
  item.reviewsCount = item.reviews.length
  const sum = item.reviews.reduce((acc, entry) => acc + entry.rating, 0)
  item.rating = Math.round((sum / item.reviews.length) * 10) / 10

  res.status(201).json(review)
})

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: Math.round(process.uptime()), hookers: hookers.length, users: users.length })
})

app.use('/api', (_req, res) => notFound(res))

app.use((error, _req, res, _next) => {
  console.error('[api]', error)
  res.status(500).json({ message: 'Внутренняя ошибка сервера' })
})

app.listen(PORT, () => {
  console.log(`API слушает http://localhost:${PORT}`)
  console.log(`Готово записей: ${hookers.length}`)
})
