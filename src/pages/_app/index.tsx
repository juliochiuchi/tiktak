import * as React from "react"
import { Link, createFileRoute } from "@tanstack/react-router"
import {
  CalendarDays,
  Clock,
  LayoutDashboard,
  ListTodo,
  ArrowRight,
  Sparkles,
} from "lucide-react"

import { DatePicker } from "@/components/app/date-picker"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { dayjs } from "@/lib/dayjs"
import { getDayKey } from "@/lib/time"

export const Route = createFileRoute("/_app/")({
  component: Index,
})

function Index() {
  const [selectedDate, setSelectedDate] = React.useState<Date>(() => new Date())
  const selectedDayKey = getDayKey(selectedDate)

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Bem-vindo</h1>
          <Sparkles className="size-5 text-amber-500" />
        </div>
        <p className="text-sm text-muted-foreground">
          Comece seu dia escolhendo uma data para abrir o workday ou acesse o
          historico rapidamente.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Link
          to="/workday-v2"
          search={{ date: getDayKey(new Date()) }}
          className="group"
        >
          <Card className="h-full overflow-hidden border-border/70 bg-linear-to-br from-primary/10 via-background to-background transition-all hover:border-primary/50 hover:shadow-md">
            <CardContent className="flex h-full flex-col gap-4 p-5">
              <div className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                <LayoutDashboard className="size-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold tracking-tight">
                    Workday de hoje
                  </span>
                  <Badge className="rounded-full bg-primary/10 text-primary text-[0.65rem]">
                    V2
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {dayjs().format("dddd, DD/MM/YYYY")}
                </p>
              </div>
              <div className="mt-auto flex items-center justify-between">
                <span className="text-xs font-medium text-primary">
                  Abrir agora
                </span>
                <ArrowRight className="size-4 text-primary transition-transform group-hover:translate-x-0.5" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/history" className="group">
          <Card className="h-full overflow-hidden border-border/70 transition-all hover:border-border hover:bg-muted/30 hover:shadow-sm">
            <CardContent className="flex h-full flex-col gap-4 p-5">
              <div className="grid size-11 place-items-center rounded-2xl bg-muted">
                <CalendarDays className="size-5 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <span className="text-base font-semibold tracking-tight">
                  Historico
                </span>
                <p className="text-xs text-muted-foreground">
                  Revise batidas e tasks por dia ou intervalo.
                </p>
              </div>
              <div className="mt-auto flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Ver historico
                </span>
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/tasks" className="group">
          <Card className="h-full overflow-hidden border-border/70 transition-all hover:border-border hover:bg-muted/30 hover:shadow-sm">
            <CardContent className="flex h-full flex-col gap-4 p-5">
              <div className="grid size-11 place-items-center rounded-2xl bg-muted">
                <ListTodo className="size-5 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <span className="text-base font-semibold tracking-tight">
                  Todas as tasks
                </span>
                <p className="text-xs text-muted-foreground">
                  Gerencie e pesquise todas as tarefas registradas.
                </p>
              </div>
              <div className="mt-auto flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Ver tasks
                </span>
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card className="overflow-hidden border-border/70 bg-card/90">
        <CardContent className="space-y-6 p-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">
              Abrir workday
            </h2>
            <p className="text-sm text-muted-foreground">
              Escolha qual dia deseja lancar batidas e tasks.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                Data
              </div>
              <DatePicker
                value={selectedDate}
                onChange={(next) => {
                  if (!next) return
                  setSelectedDate(next)
                }}
                className="h-11 w-full rounded-2xl sm:w-56"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                className="h-10 rounded-2xl px-4"
                onClick={() => setSelectedDate(new Date())}
              >
                Hoje
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="h-10 rounded-2xl px-4"
                onClick={() =>
                  setSelectedDate(
                    dayjs().subtract(1, "day").startOf("day").toDate()
                  )
                }
              >
                Ontem
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button asChild className="h-11 rounded-2xl px-6">
              <Link to="/workday-v2" search={{ date: selectedDayKey }}>
                <Clock className="size-4" />
                Abrir Workday V2
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
