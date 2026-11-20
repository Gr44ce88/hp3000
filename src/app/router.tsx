import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { AppLayout } from '@/app/AppLayout'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { RequireAuth } from '@/features/auth/RequireAuth'

const HomePage = lazy(() => import('@/pages/HomePage'))
const HookerPage = lazy(() => import('@/pages/HookerPage'))
const NewHookerPage = lazy(() => import('@/pages/NewHookerPage'))
const AuthPage = lazy(() => import('@/pages/AuthPage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))
const ProfileEditPage = lazy(() => import('@/pages/ProfileEditPage'))
const EditHookerPage = lazy(() => import('@/pages/EditHookerPage'))
const FavoritesPage = lazy(() => import('@/pages/FavoritesPage'))
const MapPage = lazy(() => import('@/pages/MapPage'))
const WidgetsPage = lazy(() => import('@/pages/WidgetsPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<FullPageSpinner />}>
            <HomePage />
          </Suspense>
        ),
      },
      {
        path: 'hookers',
        element: (
          <Suspense fallback={<FullPageSpinner />}>
            <HomePage />
          </Suspense>
        ),
      },
      {
        path: 'hookers/new',
        element: (
          <RequireAuth>
            <Suspense fallback={<FullPageSpinner />}>
              <NewHookerPage />
            </Suspense>
          </RequireAuth>
        ),
      },
      {
        path: 'hookers/:id',
        element: (
          <Suspense fallback={<FullPageSpinner />}>
            <HookerPage />
          </Suspense>
        ),
      },
      {
        path: 'profile',
        element: (
          <RequireAuth>
            <Suspense fallback={<FullPageSpinner />}>
              <ProfilePage />
            </Suspense>
          </RequireAuth>
        ),
      },
      {
        path: 'profile/edit',
        element: (
          <RequireAuth>
            <Suspense fallback={<FullPageSpinner />}>
              <ProfileEditPage />
            </Suspense>
          </RequireAuth>
        ),
      },
      {
        path: 'auth',
        element: (
          <Suspense fallback={<FullPageSpinner />}>
            <AuthPage />
          </Suspense>
        ),
      },
      {
        path: 'hookers/:id/edit',
        element: (
          <RequireAuth>
            <Suspense fallback={<FullPageSpinner />}>
              <EditHookerPage />
            </Suspense>
          </RequireAuth>
        ),
      },
      {
        path: 'map',
        element: (
          <Suspense fallback={<FullPageSpinner />}>
            <MapPage />
          </Suspense>
        ),
      },
      {
        // старый адрес карты
        path: 'heatmap',
        element: <Navigate to="/map" replace />,
      },
      {
        path: 'favorites',
        element: (
          <Suspense fallback={<FullPageSpinner />}>
            <FavoritesPage />
          </Suspense>
        ),
      },
      {
        path: 'widgets',
        element: (
          <Suspense fallback={<FullPageSpinner />}>
            <WidgetsPage />
          </Suspense>
        ),
      },
      {
        path: '*',
        element: (
          <Suspense fallback={<FullPageSpinner />}>
            <NotFoundPage />
          </Suspense>
        ),
      },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
