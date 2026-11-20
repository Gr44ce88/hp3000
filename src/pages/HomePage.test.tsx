import { describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import HomePage from '@/pages/HomePage'
import { renderWithProviders } from '@/test/render'
import { hookersFixture, extraFixture, server, setFavoriteIds } from '@/test/msw/server'
import { useSessionStore } from '@/features/auth/store'

const TOTAL = hookersFixture.length + extraFixture.length

describe('HomePage', () => {
  it('рендерит первую страницу и общий счётчик', async () => {
    renderWithProviders(<HomePage />)

    expect(await screen.findByText(/Первый контакт/)).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(12)
    expect(screen.getByText(`Найдено ${TOTAL}`)).toBeInTheDocument()
  })

  it('фильтр избранного показывает пустое состояние при пустом списке', async () => {
    useSessionStore.setState({ token: 'test-token' })
    const user = userEvent.setup()
    renderWithProviders(<HomePage />)

    await screen.findByText(/Первый контакт/)
    // панель фильтров на телефоне свёрнута — раскрываем
    await user.click(screen.getByRole('button', { name: 'Фильтры и сортировка' }))
    await user.click(screen.getByRole('button', { name: 'Избранное' }))

    expect(await screen.findByText('В избранном пусто')).toBeInTheDocument()
    expect(screen.queryByText(/Первый контакт/)).not.toBeInTheDocument()
  })

  it('поиск дебаунсится и уходит в запрос', async () => {
    const urls: string[] = []
    server.use(
      http.get('*/api/hookers', ({ request }) => {
        urls.push(request.url)
        return HttpResponse.json({
          items: hookersFixture,
          total: hookersFixture.length,
          page: 1,
          limit: 12,
          hasMore: false,
          cities: ['Москва'],
        })
      }),
    )

    const user = userEvent.setup()
    renderWithProviders(<HomePage />)
    await user.type(screen.getByLabelText('Поиск анкет'), 'Кира')

    await waitFor(() => expect(urls.some((url) => url.includes('q=%D0%9A%D0%B8%D1%80%D0%B0'))).toBe(true))
  })

  it('применяет район и бюджет из ссылки и показывает район на карточке', async () => {
    const urls: URL[] = []
    server.use(http.get('*/api/hookers', ({ request }) => {
      urls.push(new URL(request.url))
      return HttpResponse.json({ items: hookersFixture, total: hookersFixture.length,
        page: 1, limit: 12, hasMore: false, cities: ['Москва'] })
    }))
    renderWithProviders(<HomePage />, { route: '/?district=Пресня&max=3000' })
    expect(await screen.findByLabelText('Максимальный бюджет')).toHaveValue('3000')
    expect(screen.getByLabelText('Район')).toHaveValue('Пресня')
    await waitFor(() => expect(urls.some(({ searchParams }) =>
      searchParams.get('district') === 'Пресня' && searchParams.get('maxPrice') === '3000')).toBe(true))
    expect(await screen.findByRole('link', { name: /Анкета: Первый контакт.*Пресня/ })).toBeInTheDocument()
  })

  it('кнопка «Показать ещё» добавляет страницу, а не заменяет список', async () => {
    const user = userEvent.setup()
    renderWithProviders(<HomePage />)

    await screen.findByText(/Первый контакт/)
    await user.click(screen.getByRole('button', { name: 'Показать ещё' }))

    await waitFor(() => expect(screen.getByText(`Показано ${TOTAL} из ${TOTAL}`)).toBeInTheDocument())
    expect(screen.getByText(/Первый контакт/)).toBeInTheDocument()
  })

  it('фильтр «С фото» остаётся нажатым и фильтрует выдачу', async () => {
    const user = userEvent.setup()
    renderWithProviders(<HomePage />)
    await screen.findByText(/Первый контакт/)

    const filter = screen.getByRole('button', { name: 'Фильтры и сортировка' })
    await user.click(filter)
    const photoFilter = screen.getByRole('button', { name: 'С фото' })
    await user.click(photoFilter)

    expect(photoFilter).toHaveAttribute('aria-pressed', 'true')
    // у фикстур нет фото — честное пустое состояние вместо всего каталога
    expect(await screen.findByText('Под условия ничего не подошло')).toBeInTheDocument()
  })

  it('сохранённое избранное помечает карточки', async () => {
    setFavoriteIds(['1'])
    useSessionStore.setState({ token: 'test-token' })
    renderWithProviders(<HomePage />)

    const heart = await screen.findByRole('button', { name: 'Убрать из избранного: Первый контакт' })
    expect(heart).toHaveAttribute('aria-pressed', 'true')
  })
})
