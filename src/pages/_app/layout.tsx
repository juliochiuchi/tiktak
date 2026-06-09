import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router"

import { ToastProvider } from "@/components/app/toast"
import { TopNav } from "@/components/app/top-nav"

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <ToastProvider>
      <div className="min-h-dvh bg-background text-foreground">
        <TopNav />
        <main className="mx-auto w-full max-w-6xl px-3 py-10 sm:px-4">
          <div
            key={pathname}
            className="animate-in fade-in slide-in-from-bottom-1 duration-300 ease-out"
          >
            <Outlet />
          </div>
        </main>
      </div>
    </ToastProvider>
  )
}
