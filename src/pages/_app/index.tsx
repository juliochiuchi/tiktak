import * as React from "react"
import { Link, createFileRoute } from "@tanstack/react-router"

import { DatePicker } from "@/components/app/date-picker"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Open workday</h1>
        <p className="text-sm text-muted-foreground">
          Choose which day you want to log punches and tasks for.
        </p>
      </header>

      <Card>
        <CardContent className="space-y-6 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                Date
              </div>
              <DatePicker
                value={selectedDate}
                onChange={(next) => {
                  if (!next) return
                  setSelectedDate(next)
                }}
                className="h-11 rounded-2xl"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                className="h-10 rounded-2xl px-4"
                onClick={() => setSelectedDate(new Date())}
              >
                Today
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="h-10 rounded-2xl px-4"
                onClick={() =>
                  setSelectedDate(dayjs().subtract(1, "day").startOf("day").toDate())
                }
              >
                Yesterday
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button asChild className="h-11 rounded-2xl px-6">
              <Link to="/workday" search={{ date: selectedDayKey }}>
                Open Workday
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
