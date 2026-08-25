import * as React from "react"
import { Link, createFileRoute } from "@tanstack/react-router"
import { Clock, ListTodo } from "lucide-react"

import { DatePicker } from "@/components/app/date-picker"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { usePunchRecords } from "@/hooks/use-punch-records"
import { useTaskEntries } from "@/hooks/use-task-entries"
import { getRecordsForDay, getWorkedMinutesForDayClosed } from "@/lib/punch"
import { getMinutesForDate } from "@/lib/tasks"
import { dayjs } from "@/lib/dayjs"
import {
  formatClockTime,
  formatDateWithWeekday,
  formatDurationMinutes,
  getDayKey,
  getDayKeysInRange,
  parseDayKey,
} from "@/lib/time"

export const Route = createFileRoute("/_app/history")({
  component: HistoryPage,
})

type FilterMode = "single" | "range"

function HistoryPage() {
  const { records } = usePunchRecords()
  const { entries } = useTaskEntries()
  const [mode, setMode] = React.useState<FilterMode>("range")
  const [singleDate, setSingleDate] = React.useState<Date>(() => new Date())
  const [startDate, setStartDate] = React.useState<Date>(() => {
    const now = dayjs()
    const monday =
      now.day() === 0
        ? now.subtract(6, "day")
        : now.subtract(now.day() - 1, "day")
    return monday.startOf("day").toDate()
  })
  const [endDate, setEndDate] = React.useState<Date>(() => {
    const now = dayjs()
    const monday =
      now.day() === 0
        ? now.subtract(6, "day")
        : now.subtract(now.day() - 1, "day")
    return monday.add(4, "day").startOf("day").toDate()
  })

  const dayKeys = React.useMemo(() => {
    if (mode === "single") return [getDayKey(singleDate)]
    return getDayKeysInRange(startDate, endDate)
  }, [mode, singleDate, startDate, endDate])

  const orderedDayKeys = React.useMemo(
    () => [...dayKeys].sort((a, b) => (a > b ? -1 : 1)),
    [dayKeys]
  )

  const days = React.useMemo(() => {
    return orderedDayKeys.map((dayKey) => {
      const dayDate = parseDayKey(dayKey) ?? new Date()
      const dayPunches = getRecordsForDay(records, dayKey)
      const dayTasks = entries
        .filter((entry) => entry.date === dayKey)
        .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))

      return {
        dayKey,
        dayDate,
        punches: dayPunches,
        tasks: dayTasks,
        workedMinutes: getWorkedMinutesForDayClosed(records, dayKey),
        taskMinutes: getMinutesForDate(entries, dayKey),
      }
    })
  }, [entries, orderedDayKeys, records])

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">History</h1>
        <p className="text-sm text-muted-foreground">
          Review punches and tasks by day, or across a date range.
        </p>
      </header>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                Filter
              </div>
              <Select.Root
                value={mode}
                onValueChange={(value) => setMode(value as FilterMode)}
              >
                <SelectTrigger className="h-11 w-full rounded-2xl sm:w-[14rem]">
                  <SelectValue placeholder="Select filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single day</SelectItem>
                  <SelectItem value="range">Date range</SelectItem>
                </SelectContent>
              </Select.Root>
            </div>

            {mode === "single" ? (
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Day
                </div>
                <DatePicker
                  value={singleDate}
                  onChange={(next) => {
                    if (!next) return
                    setSingleDate(next)
                  }}
                  className="h-11 rounded-2xl"
                />
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">
                    From
                  </div>
                  <DatePicker
                    value={startDate}
                    onChange={(next) => {
                      if (!next) return
                      setStartDate(next)
                    }}
                    className="h-11 rounded-2xl"
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">
                    To
                  </div>
                  <DatePicker
                    value={endDate}
                    onChange={(next) => {
                      if (!next) return
                      setEndDate(next)
                    }}
                    className="h-11 rounded-2xl"
                  />
                </div>
              </div>
            )}
          </div>

          {mode === "range" ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                className="h-10 rounded-2xl px-4"
                onClick={() => {
                  const start = dayjs().startOf("week").toDate()
                  const end = dayjs().endOf("week").toDate()
                  setStartDate(start)
                  setEndDate(end)
                }}
              >
                This week
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="h-10 rounded-2xl px-4"
                onClick={() => {
                  const start = dayjs().startOf("month").toDate()
                  const end = dayjs().endOf("month").toDate()
                  setStartDate(start)
                  setEndDate(end)
                }}
              >
                This month
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {days.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Choose a valid date range to see results.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {days.map((day) => (
            <Card key={day.dayKey} className="overflow-hidden">
              <CardContent className="space-y-6 p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="text-sm font-semibold tracking-tight text-muted-foreground">
                      {formatDateWithWeekday(day.dayDate)}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 font-medium">
                        <Clock className="size-4 text-muted-foreground" />
                        {formatDurationMinutes(day.workedMinutes)} worked
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 font-medium">
                        <ListTodo className="size-4 text-muted-foreground" />
                        {formatDurationMinutes(day.taskMinutes)} logged
                      </div>
                    </div>
                  </div>

                  <Badge className="w-fit bg-primary/10 text-primary">
                    {day.dayKey}
                  </Badge>
                </div>

                <Separator />

                {day.punches.length === 0 && day.tasks.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    No punches or tasks for this day.
                  </div>
                ) : (
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-3">
                      <div className="text-xs font-semibold tracking-tight text-muted-foreground">
                        PUNCHES
                      </div>
                      <Card>
                        <CardContent className="p-0">
                          {day.punches.length === 0 ? (
                            <div className="p-6 text-sm text-muted-foreground">
                              No punches.
                            </div>
                          ) : (
                            <ul className="divide-y">
                              {day.punches.map((record) => (
                                <li key={record.id}>
                                  <Link
                                    to="/workday"
                                    search={{ date: day.dayKey }}
                                    className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div
                                        className={
                                          record.type === "in"
                                            ? "grid size-9 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                            : "grid size-9 place-items-center rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400"
                                        }
                                      >
                                        <Clock className="size-4" />
                                      </div>
                                      <div className="text-sm font-medium">
                                        {record.type === "in"
                                          ? "Clock in"
                                          : "Clock out"}
                                      </div>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {formatClockTime(new Date(record.timestamp))}
                                    </div>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-3">
                      <div className="text-xs font-semibold tracking-tight text-muted-foreground">
                        TASKS
                      </div>
                      <Card>
                        <CardContent className="p-0">
                          {day.tasks.length === 0 ? (
                            <div className="p-6 text-sm text-muted-foreground">
                              No tasks.
                            </div>
                          ) : (
                            <ul className="divide-y">
                              {day.tasks.map((task) => (
                                <li key={task.id}>
                                  <Link
                                    to="/workday"
                                    search={{ date: day.dayKey }}
                                    className="flex flex-col gap-2 p-4 transition-colors hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:flex-row sm:items-center sm:justify-between"
                                  >
                                    <div className="min-w-0 space-y-1">
                                      <div className="break-words text-sm font-medium sm:truncate">
                                        {task.description}
                                      </div>
                                      <div className="flex flex-wrap items-center gap-2">
                                        <Badge className="bg-primary/10 text-primary">
                                          {task.project}
                                        </Badge>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                          <Clock className="size-3.5" />
                                          {dayjs(task.createdAt).format("DD/MM")}
                                        </div>
                                        {task.logged ? (
                                          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                                            Logged
                                          </Badge>
                                        ) : (
                                          <Badge className="bg-muted text-muted-foreground">
                                            Not logged
                                          </Badge>
                                        )}
                                      </div>
                                      {task.logged && task.jiraIssueKey ? (
                                        <div className="flex flex-wrap items-center gap-2">
                                          <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-300">
                                            Jira {task.jiraIssueKey}
                                          </Badge>
                                          {task.branchName ? (
                                            <Badge className="max-w-full whitespace-normal break-all bg-muted font-mono text-muted-foreground sm:max-w-[16rem] sm:overflow-hidden sm:text-ellipsis sm:whitespace-nowrap">
                                              {task.branchName}
                                            </Badge>
                                          ) : null}
                                        </div>
                                      ) : task.branchName ? (
                                        <div className="flex flex-wrap items-center gap-2">
                                          <Badge className="max-w-full whitespace-normal break-all bg-muted font-mono text-muted-foreground sm:max-w-[16rem] sm:overflow-hidden sm:text-ellipsis sm:whitespace-nowrap">
                                            {task.branchName}
                                          </Badge>
                                        </div>
                                      ) : null}
                                    </div>
                                    <div className="shrink-0 text-sm font-medium">
                                      {formatDurationMinutes(task.durationMinutes)}
                                    </div>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
