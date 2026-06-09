import { RouterProvider } from '@tanstack/react-router'
import { router } from './router'
import { LoadingOverlay } from '@/components/app/loading-overlay'

export function App() {
  return (
    <>
      <RouterProvider router={router} />
      <LoadingOverlay />
    </>
  )
}
