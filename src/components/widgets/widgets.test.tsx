import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HookerCard } from '@/components/widgets/HookerCard'
import { ProfileChip } from '@/components/widgets/ProfileChip'
import { ReviewCard } from '@/components/widgets/ReviewCard'
import { renderWithProviders } from '@/test/render'

describe('HookerCard', () => {
  it('показывает цену, город и ссылку на анкету', () => {
    renderWithProviders(
      <HookerCard name="Аня" age={24} city="Москва" pricePerHour={5000} href="/hookers/1" />,
    )

    expect(screen.getByText('Аня,')).toBeInTheDocument()
    expect(screen.getByText(/5\s?000/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Анкета: Аня/ })).toHaveAttribute('href', '/hookers/1')
  })

  it('книжная ориентация помечает карточку как четверть ширины', () => {
    const { container } = renderWithProviders(
      <HookerCard
        name="Кира"
        age={22}
        city="Химки"
        pricePerHour={2800}
        orientation="portrait"
        width="quarter"
      />,
    )

    expect(container.querySelector('article')?.className).toContain('w-1/4')
  })
})

describe('ProfileChip', () => {
  it('свой профиль даёт действия по аккаунту', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ProfileChip variant="own" name="Аня" />)

    await user.click(screen.getByRole('button', { name: /Аня/ }))
    const menu = screen.getByRole('menu')

    expect(within(menu).getByRole('menuitem', { name: 'Редактировать' })).toBeInTheDocument()
    expect(within(menu).getByRole('menuitem', { name: 'Избранное' })).toBeInTheDocument()
  })

  it('чужой профиль показывает отзывы и дату без действий', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <ProfileChip variant="foreign" name="Милана" reviewsCount={4} registeredAt="2024-03-12" />,
    )

    await user.click(screen.getByRole('button', { name: /Милана/ }))
    const menu = screen.getByRole('menu')

    expect(within(menu).getByText('4')).toBeInTheDocument()
    expect(within(menu).queryAllByRole('menuitem')).toHaveLength(0)
  })

  it('анонимный ведёт на авторизацию', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ProfileChip variant="anonymous" />)

    await user.click(screen.getByRole('button', { name: /Войти/ }))

    expect(within(screen.getByRole('menu')).getByRole('menuitem', { name: 'Войти' })).toHaveAttribute(
      'href',
      '/auth',
    )
  })
})

describe('ReviewCard', () => {
  it('обрезает оценку до 5 заёзд и печатает текст', () => {
    renderWithProviders(<ReviewCard author="Дмитрий" text="Всё по анкете" rating={9} />)

    expect(screen.getByRole('img', { name: 'Оценка 5 из 5' })).toBeInTheDocument()
    expect(screen.getByText('Всё по анкете')).toBeInTheDocument()
  })
})
