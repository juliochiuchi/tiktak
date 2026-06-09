import type { ComponentType } from "react"
import { Link } from "@tanstack/react-router"
import {
  CalendarDays,
  ClipboardList,
  Clock,
  Home,
  LayoutDashboard,
} from "lucide-react"

import { ThemeToggle } from "@/components/app/theme-toggle"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type NavItem = {
  to: string
  label: string
  Icon: ComponentType<{ className?: string }>
}

const items: NavItem[] = [
  { to: "/", label: "Home", Icon: Home },
  { to: "/workday", label: "Workday", Icon: LayoutDashboard },
  { to: "/point", label: "Punch", Icon: Clock },
  { to: "/tasks", label: "Tasks", Icon: ClipboardList },
  { to: "/history", label: "History", Icon: CalendarDays },
]

export function TopNav() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-3 sm:px-4">
        <div className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Clock className="size-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight">TikTak</span>
        </div>

        <div className="flex items-center gap-2">
          <nav className="rounded-full border bg-muted p-1">
            <div className="flex items-center gap-1">
              {items.map((item) => (
                <Button
                  key={item.to}
                  asChild
                  variant="ghost"
                  size="sm"
                  className="rounded-full"
                >
                  <Link
                    to={item.to}
                    className={cn(
                      "text-muted-foreground hover:text-foreground",
                      "data-[status=active]:bg-background data-[status=active]:text-foreground data-[status=active]:shadow-sm"
                    )}
                    activeOptions={{ exact: true, includeSearch: false }}
                  >
                    <item.Icon className="size-4" />
                    {item.label}
                  </Link>
                </Button>
              ))}
            </div>
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
