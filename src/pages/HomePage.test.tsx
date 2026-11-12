import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HomePage from '@/pages/HomePage'
import { renderWithProviders } from '@/test/render'
import { hookersFixture } from '@/test/msw/server'
import { useSessionStore } from '@/features/auth/store'

describe('HomePage', () => {
  it('рендерит карточки из API', async () => {
    renderWithProviders(<HomePage />)

    expect(await screen.findByText(/Первый контакт/)).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(hookersFixture.length)
    expect(screen.getByText('Найдено 2')).toBeInTheDocument()
  })

  it('переключает фильтр избранного', async () => {
    useSessionStore.setState({ token: 'test-token' })
    const user = userEvent.setup()
    renderWithProviders(<HomePage />)

    await screen.findByText(/Первый контакт/)
    const favoriteFilter = screen.getByRole('button', { name: 'Избранное' })

    await user.click(favoriteFilter)

    expect(favoriteFilter).toHaveAttribute('aria-pressed', 'true')
    useSessionStore.setState({ token: null })
  })

  it('ищет по строке и показывает счётчик из ответа', async () => {
    const user = userEvent.setup()
    renderWithProviders(<HomePage />)

    await screen.findByText(/Первый контакт/)
    await user.type(screen.getByLabelText('Поиск анкет'), 'Перв')

    expect(await screen.findByText('Найдено 2')).toBeInTheDocument()
  })
})
