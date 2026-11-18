import { randomUUID } from 'node:crypto'
import { extname } from 'node:path'
import { Router } from 'express'
import multer from 'multer'
import { requireAuth } from '../auth/middleware.ts'
import { badRequest } from '../http/errors.ts'

const MAX_BYTES = 2 * 1024 * 1024
const ALLOWED = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
])

const upload = multer({
  storage: multer.diskStorage({
    destination: 'public/uploads',
    filename: (_req, file, callback) => {
      const ext = ALLOWED.get(file.mimetype) ?? extname(file.originalname) ?? '.jpg'
      callback(null, `${randomUUID()}${ext}`)
    },
  }),
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED.has(file.mimetype)) {
      callback(badRequest('Только JPEG, PNG или WebP'))
      return
    }
    callback(null, true)
  },
})

export const uploadsRouter: Router = Router()

/** Загрузка одного фото анкеты: отдаём готовый URL для сохранения в анкете. */
uploadsRouter.post('/uploads', requireAuth, upload.single('file'), (req, res) => {
  const file = req.file
  if (!file) {
    res.status(422).json({ message: 'Файл не получен' })
    return
  }
  res.status(201).json({ url: `/uploads/${file.filename}`, size: file.size })
})
