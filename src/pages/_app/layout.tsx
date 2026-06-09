import { Outlet, createFileRoute } from "@tanstack/react-router"

import { ToastProvider } from "@/components/app/toast"
import { TopNav } from "@/components/app/top-nav"

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

function AppLayout() {
  return (
    <ToastProvider>
      <div className="min-h-dvh bg-background text-foreground">
        <TopNav />
        <main className="mx-auto w-full max-w-6xl px-3 py-10 sm:px-4">
          <Outlet />
        </main>
      </div>
    </ToastProvider>
  )
}
