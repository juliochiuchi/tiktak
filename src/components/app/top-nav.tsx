import * as React from "react"
import type { ComponentType } from "react"
import { Link } from "@tanstack/react-router"
import {
  CalendarDays,
  ClipboardList,
  Clock,
  Home,
  Menu,
  PanelLeft,
} from "lucide-react"

import { ThemeToggle } from "@/components/app/theme-toggle"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent } from "@/components/ui/drawer"
import { cn } from "@/lib/utils"

type NavItem = {
  to: string
  label: string
  Icon: ComponentType<{ className?: string }>
}

const items: NavItem[] = [
  { to: "/", label: "Home", Icon: Home },
  { to: "/workday-v2", label: "Workday", Icon: PanelLeft },
  { to: "/point", label: "Punch", Icon: Clock },
  { to: "/tasks", label: "Tasks", Icon: ClipboardList },
  { to: "/history", label: "History", Icon: CalendarDays },
]

export function TopNav() {
  const [open, setOpen] = React.useState(false)

  return (
    <header className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-7 lg:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Clock className="size-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight">TikTak</span>
        </Link>

        <div className="flex items-center gap-2">
          <nav className="hidden rounded-full border bg-muted p-1 sm:block">
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
          <Drawer.Root open={open} onOpenChange={setOpen}>
            <Drawer.Trigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-xl sm:hidden"
                aria-label="Open menu"
              >
                <Menu className="size-4" />
              </Button>
            </Drawer.Trigger>
            <DrawerContent side="left" className="sm:hidden">
              <div className="flex h-16 items-center justify-between border-b px-5">
                <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
                  <div className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                    <Clock className="size-4" />
                  </div>
                  <span className="text-sm font-semibold tracking-tight">TikTak</span>
                </Link>
                <Drawer.Close asChild>
                  <Button type="button" variant="ghost" size="icon" className="rounded-xl">
                    <span className="sr-only">Close menu</span>
                    {"✕"}
                  </Button>
                </Drawer.Close>
              </div>

              <div className="p-3">
                <div className="grid gap-1">
                  {items.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                        "data-[status=active]:bg-muted data-[status=active]:text-foreground"
                      )}
                      activeOptions={{ exact: true, includeSearch: false }}
                    >
                      <item.Icon className="size-4" />
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </DrawerContent>
          </Drawer.Root>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
