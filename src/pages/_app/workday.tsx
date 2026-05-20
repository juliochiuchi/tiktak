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
          <h1 className="text-3xl font-semibold tracking-tight">Workday</h1>
          <p className="text-sm text-muted-foreground">
            Clock in/out and log tasks for a specific day.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm font-medium text-muted-foreground">
            Active day
          </div>
          <DatePicker
            value={selectedDate}
            onChange={(next) => {
              if (!next) return
              setSelectedDate(next)
            }}
            className="h-11 w-[11.5rem] shrink-0 rounded-2xl"
          />
        </div>
      </header>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <section className="min-w-0 flex-1">
          <PointPage headingLevel="h2" activeDayKey={selectedDayKey} />
        </section>

        <section className="min-w-0 flex-1">
          <TasksPage headingLevel="h2" activeDayKey={selectedDayKey} />
        </section>
      </div>
    </div>
  )
}
