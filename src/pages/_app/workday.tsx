import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { DatePicker } from "@/components/app/date-picker"
import { PointPage } from "@/components/app/point-page"
import { TasksPage } from "@/components/app/tasks-page"
import { parseDayKey, getDayKey } from "@/lib/time"

export const Route = createFileRoute("/_app/workday")({
  validateSearch: z.object({
    date: z.string().optional(),
  }),
  component: Workday,
})

function Workday() {
  const search = Route.useSearch()
  const initialDate = parseDayKey(search.date ?? "") ?? new Date()
  const [selectedDate, setSelectedDate] = React.useState<Date>(initialDate)
  const selectedDayKey = getDayKey(selectedDate)

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Jornada de trabalho</h1>
          <p className="text-sm text-muted-foreground">
            Registre entrada/saída e tarefas para um dia específico.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="text-sm font-medium text-muted-foreground">
            Dia ativo
          </div>
          <DatePicker
            value={selectedDate}
            onChange={(next) => {
              if (!next) return
              setSelectedDate(next)
            }}
            className="h-11 w-full rounded-2xl sm:w-[11.5rem] sm:shrink-0"
          />
        </div>
      </header>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <section className="min-w-0 flex-1 lg:flex-[0.85]">
          <PointPage headingLevel="h2" activeDayKey={selectedDayKey} />
        </section>

        <section className="min-w-0 flex-1 lg:flex-[1.15]">
          <TasksPage headingLevel="h2" activeDayKey={selectedDayKey} />
        </section>
      </div>
    </div>
  )
}
