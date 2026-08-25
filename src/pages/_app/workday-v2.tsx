import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  ListTodo,
  LogIn,
  LogOut,
  Plus,
  X,
  Pencil,
  Trash2,
  Check,
  Search,
  Copy,
  ListChecks,
} from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { DatePicker } from "@/components/app/date-picker"
import { ConfirmDialog } from "@/components/app/confirm-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Drawer, DrawerContent } from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { TimeInput } from "@/components/ui/time-input"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { usePunchRecords } from "@/hooks/use-punch-records"
import { useTaskEntries } from "@/hooks/use-task-entries"
import { useProjects } from "@/hooks/use-projects"
import {
  getRecordsForDay,
  getWorkedMinutesForDay,
  getWorkedMinutesForDayClosed,
} from "@/lib/punch"
import { groupTasksByDate, getMinutesForDate } from "@/lib/tasks"
import { dayjs } from "@/lib/dayjs"
import { parseTimeInput } from "@/lib/time-input"
import {
  formatClockTime,
  formatDateWithWeekday,
  formatDurationMinutes,
  formatSeconds,
  getDayKey,
  getDayKeysInRange,
  parseDayKey,
} from "@/lib/time"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/_app/workday-v2")({
  validateSearch: z.object({
    date: z.string().optional(),
  }),
  component: WorkdayV2,
})

const createTaskSchema = z.object({
  description: z.string().min(1, "Enter a description"),
  project: z.string().min(1, "Select a project"),
  date: z.date(),
  duration: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM"),
  logged: z.boolean().default(false),
  jiraIssueKey: z.string().default(""),
  branchName: z.string().default(""),
})

type CreateTaskValues = z.input<typeof createTaskSchema>

function durationToMinutes(value: string) {
  const [hoursText, minutesText] = value.split(":")
  const hours = Number(hoursText ?? 0)
  const minutes = Number(minutesText ?? 0)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0
  return Math.max(0, hours) * 60 + Math.min(59, Math.max(0, minutes))
}

function getTaskDescriptionText(description: string) {
  return description.trim()
}

function getGroupedDescriptions(
  entries: Array<{
    description: string
  }>
) {
  return entries
    .map((entry) => getTaskDescriptionText(entry.description))
    .filter(Boolean)
    .join("\n")
}

async function copyToClipboard(value: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }
  if (typeof document === "undefined") {
    throw new Error("Clipboard unavailable")
  }
  const textarea = document.createElement("textarea")
  textarea.value = value
  textarea.setAttribute("readonly", "")
  textarea.style.position = "fixed"
  textarea.style.opacity = "0"
  textarea.style.pointerEvents = "none"
  document.body.appendChild(textarea)
  textarea.select()
  const didCopy = document.execCommand("copy")
  document.body.removeChild(textarea)
  if (!didCopy) {
    throw new Error("Clipboard unavailable")
  }
}

type WeekDay = {
  dayKey: string
  date: Date
  dayName: string
  dayNumber: string
  isToday: boolean
  isSelected: boolean
  hasPunches: boolean
  hasTasks: boolean
  workedMinutes: number
  taskMinutes: number
}

function WorkdayV2() {
  const search = Route.useSearch()
  const initialDate = parseDayKey(search.date ?? "") ?? new Date()
  const [selectedDate, setSelectedDate] = React.useState<Date>(initialDate)
  const [now, setNow] = React.useState(() => new Date())
  const [punchDrawerOpen, setPunchDrawerOpen] = React.useState(false)
  const [tasksDrawerOpen, setTasksDrawerOpen] = React.useState(false)

  const { records } = usePunchRecords()
  const { entries } = useTaskEntries()

  const selectedDayKey = getDayKey(selectedDate)

  React.useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(interval)
  }, [])

  const weekStart = dayjs(selectedDate).startOf("week").toDate()
  const weekEnd = dayjs(selectedDate).endOf("week").toDate()
  const weekDayKeys = getDayKeysInRange(weekStart, weekEnd)
  const todayKey = getDayKey(now)

  const weekDays: WeekDay[] = React.useMemo(() => {
    return weekDayKeys.map((dayKey) => {
      const date = parseDayKey(dayKey) ?? new Date()
      const dayPunches = getRecordsForDay(records, dayKey)
      const dayTasks = entries.filter((e) => e.date === dayKey)
      return {
        dayKey,
        date,
        dayName: dayjs(date).format("ddd"),
        dayNumber: dayjs(date).format("DD"),
        isToday: dayKey === todayKey,
        isSelected: dayKey === selectedDayKey,
        hasPunches: dayPunches.length > 0,
        hasTasks: dayTasks.length > 0,
        workedMinutes: getWorkedMinutesForDayClosed(records, dayKey),
        taskMinutes: getMinutesForDate(entries, dayKey),
      }
    })
  }, [weekDayKeys, records, entries, todayKey, selectedDayKey])

  const todayRecords = getRecordsForDay(records, selectedDayKey).sort(
    (a, b) => (a.timestamp < b.timestamp ? -1 : 1)
  )
  const isToday = selectedDayKey === todayKey
  const totalWorkedMinutes = isToday
    ? getWorkedMinutesForDay(records, selectedDayKey, now)
    : getWorkedMinutesForDayClosed(records, selectedDayKey)
  const totalWorkedMinutesClosed = getWorkedMinutesForDayClosed(
    records,
    selectedDayKey
  )
  const targetWorkedMinutes = 8 * 60
  const firstEntryRecord = todayRecords.find((r) => r.type === "in")
  const lastRecord = todayRecords.at(-1)
  const selectedWeekday =
    formatDateWithWeekday(selectedDate).split(",")[0] ?? ""
  const selectedDateLabel = dayjs(selectedDate).format("DD/MM/YYYY")

  const suggestedLastPunch = React.useMemo(() => {
    if (todayRecords.length === 0) return "Inicie uma entrada"
    if (totalWorkedMinutes >= targetWorkedMinutes) return "Meta atingida"
    if (!firstEntryRecord) return "Inicie uma entrada"
    if (lastRecord?.type !== "in") return "Abra uma entrada"

    const remainingWorkedMinutes = Math.max(
      0,
      targetWorkedMinutes - totalWorkedMinutesClosed
    )
    const suggestedTime = dayjs(new Date(lastRecord.timestamp))
      .second(0)
      .millisecond(0)
      .add(remainingWorkedMinutes, "minute")
      .toDate()

    return formatClockTime(suggestedTime)
  }, [
    firstEntryRecord,
    lastRecord,
    targetWorkedMinutes,
    totalWorkedMinutesClosed,
    todayRecords,
    totalWorkedMinutes,
  ])

  const activeEntries = React.useMemo(
    () => entries.filter((entry) => entry.date === selectedDayKey),
    [selectedDayKey, entries]
  )
  const totalTaskMinutes = getMinutesForDate(entries, selectedDayKey)

  function navigateWeek(direction: -1 | 1) {
    const next = dayjs(selectedDate)
      .add(direction * 7, "day")
      .toDate()
    setSelectedDate(next)
  }

  function handleSelectWeekDay(dayKey: string) {
    const date = parseDayKey(dayKey)
    if (date) setSelectedDate(date)
  }

  const weekWorkedMinutes = weekDays.reduce(
    (acc, d) => acc + d.workedMinutes,
    0
  )
  const weekTaskMinutes = weekDays.reduce(
    (acc, d) => acc + d.taskMinutes,
    0
  )

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">Workday</h1>
            <Badge className="rounded-full bg-primary/10 text-primary">
              V2
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Versao nova com drawers laterais e visualizacao de semana.
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

      <Card className="overflow-hidden border-border/70 bg-card/90">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="rounded-xl"
              onClick={() => navigateWeek(-1)}
              aria-label="Semana anterior"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <div className="flex flex-col items-center">
              <div className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Semana
              </div>
              <div className="mt-1 text-sm font-medium">
                {dayjs(weekStart).format("DD/MM")} —{" "}
                {dayjs(weekEnd).format("DD/MM/YYYY")}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="rounded-xl"
              onClick={() => navigateWeek(1)}
              aria-label="Proxima semana"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1.5 sm:gap-2">
            {weekDays.map((day) => (
              <button
                key={day.dayKey}
                type="button"
                onClick={() => handleSelectWeekDay(day.dayKey)}
                className={cn(
                  "group relative flex flex-col items-center gap-1 rounded-2xl border p-2 sm:p-3 transition-all",
                  day.isSelected
                    ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                    : "border-border/60 hover:border-border hover:bg-muted/40"
                )}
              >
                <span
                  className={cn(
                    "text-[0.65rem] font-semibold uppercase tracking-wider sm:text-[0.7rem]",
                    day.isToday
                      ? "text-primary"
                      : day.isSelected
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {day.dayName}
                </span>
                <span
                  className={cn(
                    "grid size-7 place-items-center rounded-xl text-sm font-semibold sm:size-8 sm:text-base",
                    day.isToday &&
                      !day.isSelected &&
                      "bg-primary text-primary-foreground",
                    day.isSelected &&
                      "bg-primary text-primary-foreground"
                  )}
                >
                  {day.dayNumber}
                </span>
                <div className="mt-1 flex items-center gap-1">
                  <span
                    className={cn(
                      "size-1.5 rounded-full sm:size-2",
                      day.hasPunches ? "bg-emerald-500" : "bg-transparent"
                    )}
                    aria-hidden
                  />
                  <span
                    className={cn(
                      "size-1.5 rounded-full sm:size-2",
                      day.hasTasks ? "bg-indigo-500" : "bg-transparent"
                    )}
                    aria-hidden
                  />
                </div>
                <div className="mt-1 line-clamp-1 text-[0.6rem] font-medium text-muted-foreground sm:text-[0.7rem]">
                  {formatDurationMinutes(day.workedMinutes + day.taskMinutes)}
                </div>
              </button>
            ))}
          </div>

          <Separator className="my-5" />

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
              <div className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Horas semanais trabalhadas
              </div>
              <div className="mt-2 text-2xl font-semibold tracking-tight">
                {formatDurationMinutes(weekWorkedMinutes)}
              </div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
              <div className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Horas semanais em tasks
              </div>
              <div className="mt-2 text-2xl font-semibold tracking-tight">
                {formatDurationMinutes(weekTaskMinutes)}
              </div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
              <div className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Meta semanal
              </div>
              <div className="mt-2 text-2xl font-semibold tracking-tight">
                {formatDurationMinutes(40 * 60)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border/70 bg-linear-to-b from-background via-background to-muted/40 shadow-sm">
        <CardContent className="p-5 sm:p-6 lg:p-8">
          <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-6 text-center sm:px-6 sm:py-8">
            <div className="flex flex-wrap items-end justify-center gap-x-3 gap-y-1">
              <span className="text-[clamp(3.25rem,16vw,5.75rem)] leading-none font-light tracking-tight">
                {formatClockTime(now)}
              </span>
              <span className="pb-2 text-[clamp(1.5rem,6vw,2.25rem)] leading-none font-light text-muted-foreground sm:pb-3">
                {formatSeconds(now)}
              </span>
            </div>

            <div className="mt-3 max-w-md text-sm text-muted-foreground">
              {formatDateWithWeekday(selectedDate)}
            </div>

            <div className="mt-6 w-full max-w-md">
              <div className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {selectedWeekday}
              </div>
              <div className="mt-1 text-xl font-semibold tracking-tight">
                {selectedDateLabel}
              </div>
            </div>

            <div className="mt-6 grid w-full max-w-md gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-card p-4">
                <div className="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  <Clock className="size-3.5" />
                  Horas trabalhadas
                </div>
                <div className="mt-2 text-2xl font-semibold tracking-tight">
                  {formatDurationMinutes(totalWorkedMinutes)}
                </div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card p-4">
                <div className="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  <ListTodo className="size-3.5" />
                  Horas em tasks
                </div>
                <div className="mt-2 text-2xl font-semibold tracking-tight">
                  {formatDurationMinutes(totalTaskMinutes)}
                </div>
              </div>
            </div>

            <div className="mt-4 w-full max-w-md rounded-2xl border border-border/60 bg-card p-4">
              <div className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Ultimo ponto sugerido
              </div>
              <div className="mt-2 text-lg font-semibold tracking-tight">
                {suggestedLastPunch}
              </div>
            </div>

            <div className="mt-8 grid w-full max-w-md gap-3 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                className="h-14 w-full justify-center gap-2 rounded-2xl border-border/80 px-5 text-base"
                onClick={() => setPunchDrawerOpen(true)}
              >
                <Clock className="size-5" />
                <div className="flex flex-col items-start">
                  <span className="text-sm font-semibold leading-none">
                    Bater ponto
                  </span>
                  <span className="mt-1 text-[0.7rem] font-normal text-muted-foreground">
                    {todayRecords.length} registros
                  </span>
                </div>
              </Button>

              <Button
                type="button"
                className="h-14 w-full justify-center gap-2 rounded-2xl px-5 text-base"
                onClick={() => setTasksDrawerOpen(true)}
              >
                <ListChecks className="size-5" />
                <div className="flex flex-col items-start">
                  <span className="text-sm font-semibold leading-none">
                    Tasks
                  </span>
                  <span className="mt-1 text-[0.7rem] font-normal text-primary-foreground/80">
                    {activeEntries.length} tarefas
                  </span>
                </div>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <PunchDrawer
        open={punchDrawerOpen}
        onOpenChange={setPunchDrawerOpen}
        activeDayKey={selectedDayKey}
        selectedDate={selectedDate}
      />

      <TasksDrawer
        open={tasksDrawerOpen}
        onOpenChange={setTasksDrawerOpen}
        activeDayKey={selectedDayKey}
        selectedDate={selectedDate}
      />
    </div>
  )
}

type PunchDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeDayKey: string
  selectedDate: Date
}

function PunchDrawer({
  open,
  onOpenChange,
  activeDayKey,
  selectedDate,
}: PunchDrawerProps) {
  const { records, addRecord, removeRecord, updateRecord } = usePunchRecords()
  const { toast } = useToast()
  const [now, setNow] = React.useState(() => new Date())
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [draftType, setDraftType] = React.useState<"in" | "out">("in")
  const [draftDate, setDraftDate] = React.useState<Date>(() => new Date())
  const [draftTime, setDraftTime] = React.useState("00:00")

  React.useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(interval)
  }, [])

  const dayDate = parseDayKey(activeDayKey) ?? selectedDate
  const isToday = activeDayKey === getDayKey(now)

  const todayRecords = getRecordsForDay(records, activeDayKey).sort((a, b) =>
    a.timestamp < b.timestamp ? -1 : 1
  )

  const totalWorkedMinutes = isToday
    ? getWorkedMinutesForDay(records, activeDayKey, now)
    : getWorkedMinutesForDayClosed(records, activeDayKey)
  const totalWorkedMinutesClosed = getWorkedMinutesForDayClosed(
    records,
    activeDayKey
  )
  const targetWorkedMinutes = 8 * 60
  const firstEntryRecord = todayRecords.find((r) => r.type === "in")
  const lastRecord = todayRecords.at(-1)
  const nextType = lastRecord?.type === "in" ? "out" : "in"
  const selectedWeekday = formatDateWithWeekday(dayDate).split(",")[0] ?? ""
  const selectedDateLabel = dayjs(dayDate).format("DD/MM/YYYY")

  const suggestedLastPunch = React.useMemo(() => {
    if (todayRecords.length === 0) return "Inicie uma entrada"
    if (totalWorkedMinutes >= targetWorkedMinutes) return "Meta atingida"
    if (!firstEntryRecord) return "Inicie uma entrada"
    if (lastRecord?.type !== "in") return "Abra uma entrada"

    const remainingWorkedMinutes = Math.max(
      0,
      targetWorkedMinutes - totalWorkedMinutesClosed
    )
    const suggestedTime = dayjs(new Date(lastRecord.timestamp))
      .second(0)
      .millisecond(0)
      .add(remainingWorkedMinutes, "minute")
      .toDate()

    return formatClockTime(suggestedTime)
  }, [
    firstEntryRecord,
    lastRecord,
    targetWorkedMinutes,
    totalWorkedMinutesClosed,
    todayRecords,
    totalWorkedMinutes,
  ])

  function startEdit(id: string) {
    const record = records.find((item) => item.id === id)
    if (!record) return
    setEditingId(id)
    setDraftType(record.type)
    setDraftDate(dayjs(record.timestamp).startOf("day").toDate())
    setDraftTime(dayjs(record.timestamp).format("HH:mm"))
  }

  function cancelEdit() {
    setEditingId(null)
  }

  function handleEditKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return
    event.preventDefault()
    void saveEdit()
  }

  async function saveEdit() {
    if (!editingId) return
    const time = parseTimeInput(draftTime)
    if (!time) return
    const next = dayjs(draftDate)
      .hour(time.hours)
      .minute(time.minutes)
      .second(0)
      .millisecond(0)
      .toDate()

    try {
      await updateRecord(editingId, {
        type: draftType,
        timestamp: next.toISOString(),
      })
      toast({
        title: "Batida atualizada",
        description: `${draftType === "in" ? "Entrada" : "Saida"} • ${formatClockTime(next)}`,
        variant: "success",
      })
      setEditingId(null)
    } catch {
      toast({
        title: "Nao foi possivel atualizar",
        description: "Tente novamente.",
        variant: "error",
      })
    }
  }

  const primaryAction =
    nextType === "out"
      ? {
          label: "Registrar saida",
          Icon: LogOut,
          className:
            "h-12 rounded-2xl bg-rose-500 px-6 text-base text-white shadow-sm hover:bg-rose-600",
        }
      : {
          label: "Registrar entrada",
          Icon: LogIn,
          className:
            "h-12 rounded-2xl bg-emerald-500 px-6 text-base text-white shadow-sm hover:bg-emerald-600",
        }

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <DrawerContent side="left" className="w-[min(24rem,90vw)] p-0">
        <div className="flex h-16 shrink-0 items-center justify-between border-b px-5">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              <span className="text-sm font-semibold tracking-tight">
                Bater ponto
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {selectedWeekday} • {selectedDateLabel}
            </div>
          </div>
          <Drawer.Close asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-xl"
            >
              <span className="sr-only">Fechar</span>
              <X className="size-4" />
            </Button>
          </Drawer.Close>
        </div>

        <div className="space-y-6 p-5">
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-center">
            <div className="flex flex-wrap items-end justify-center gap-x-2 gap-y-1">
              <span className="text-4xl font-light tracking-tight">
                {formatClockTime(now)}
              </span>
              <span className="pb-1.5 text-xl font-light text-muted-foreground">
                {formatSeconds(now)}
              </span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {formatDateWithWeekday(dayDate)}
            </div>
            <div className="mt-4">
              <Button
                onClick={async () => {
                  const timestamp = isToday
                    ? dayjs(now).second(0).millisecond(0).toDate()
                    : dayjs(dayDate)
                        .hour(now.getHours())
                        .minute(now.getMinutes())
                        .second(0)
                        .millisecond(0)
                        .toDate()
                  try {
                    await addRecord(nextType, timestamp)
                    toast({
                      title: "Batida registrada",
                      description: `${nextType === "in" ? "Entrada" : "Saida"} • ${formatClockTime(timestamp)}`,
                      variant: "success",
                    })
                  } catch {
                    toast({
                      title: "Nao foi possivel registrar",
                      description: "Tente novamente.",
                      variant: "error",
                    })
                  }
                }}
                className={`${primaryAction.className} w-full justify-center px-5`}
              >
                <primaryAction.Icon className="size-4" />
                {primaryAction.label}
              </Button>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-2xl border border-border/60 bg-card p-4">
              <div className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Soma de horas trabalhadas
              </div>
              <div className="mt-2 text-2xl font-semibold tracking-tight">
                {formatDurationMinutes(totalWorkedMinutes)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Meta do dia: 8h
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-4">
              <div className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Ultimo ponto sugerido
              </div>
              <div className="mt-2 text-xl font-semibold tracking-tight">
                {suggestedLastPunch}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Para fechar 8h no total.
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold tracking-tight text-muted-foreground">
                REGISTROS DO DIA
              </h3>
              <p className="text-xs text-muted-foreground">
                Historico das batidas do dia selecionado.
              </p>
            </div>

            {todayRecords.length === 0 ? (
              <div className="rounded-2xl border border-border/60 bg-card p-5 text-sm text-muted-foreground">
                Nenhuma batida registrada.
              </div>
            ) : (
              <ul className="grid gap-3">
                {todayRecords.map((record) => {
                  const isEditing = editingId === record.id
                  const recordDate = new Date(record.timestamp)

                  return (
                    <li key={record.id}>
                      <Card className="overflow-hidden border-border/70 bg-card/90">
                        <CardContent className="p-4">
                          <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                              <div className="flex min-w-0 items-start gap-3">
                                <div
                                  className={
                                    record.type === "in"
                                      ? "grid size-10 shrink-0 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                      : "grid size-10 shrink-0 place-items-center rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400"
                                  }
                                >
                                  {record.type === "in" ? (
                                    <LogIn className="size-4" />
                                  ) : (
                                    <LogOut className="size-4" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                    Hora da batida
                                  </div>
                                  <div className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                                    {formatClockTime(recordDate)}
                                  </div>
                                </div>
                              </div>

                              {!isEditing ? (
                                <div className="flex items-center justify-end gap-1 sm:shrink-0">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    className="rounded-xl"
                                    onClick={() => startEdit(record.id)}
                                    aria-label="Editar"
                                  >
                                    <Pencil className="size-4" />
                                  </Button>
                                  <ConfirmDialog
                                    title="Excluir batida?"
                                    description="Essa acao nao pode ser desfeita."
                                    confirmLabel="Excluir"
                                    onConfirm={async () => {
                                      try {
                                        await removeRecord(record.id)
                                        toast({
                                          title: "Batida excluida",
                                          description: `${record.type === "in" ? "Entrada" : "Saida"} • ${formatClockTime(
                                            new Date(record.timestamp)
                                          )}`,
                                          variant: "success",
                                        })
                                      } catch {
                                        toast({
                                          title: "Nao foi possivel excluir",
                                          description: "Tente novamente.",
                                          variant: "error",
                                        })
                                      }
                                    }}
                                  >
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon-sm"
                                      className="rounded-xl text-destructive hover:text-destructive"
                                      aria-label="Excluir"
                                    >
                                      <Trash2 className="size-4" />
                                    </Button>
                                  </ConfirmDialog>
                                </div>
                              ) : null}
                            </div>

                            {isEditing ? (
                              <form
                                className="rounded-2xl border border-border/70 bg-muted/30 p-4"
                                onSubmit={(event) => {
                                  event.preventDefault()
                                  saveEdit()
                                }}
                              >
                                <div className="flex flex-col gap-4">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Button
                                      type="button"
                                      variant={draftType === "in" ? "secondary" : "outline"}
                                      size="sm"
                                      className="h-9 rounded-xl px-3"
                                      onClick={() => setDraftType("in")}
                                    >
                                      Entrada
                                    </Button>
                                    <Button
                                      type="button"
                                      variant={draftType === "out" ? "secondary" : "outline"}
                                      size="sm"
                                      className="h-9 rounded-xl px-3"
                                      onClick={() => setDraftType("out")}
                                    >
                                      Saida
                                    </Button>
                                  </div>

                                  <div className="grid gap-3">
                                    <label className="space-y-1.5">
                                      <span className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                        Data
                                      </span>
                                      <Input
                                        type="date"
                                        value={getDayKey(draftDate)}
                                        onChange={(event) => {
                                          const next = parseDayKey(
                                            event.currentTarget.value
                                          )
                                          if (!next) return
                                          setDraftDate(next)
                                        }}
                                        onKeyDown={handleEditKeyDown}
                                        className="h-10 rounded-xl bg-background"
                                      />
                                    </label>

                                    <label className="space-y-1.5">
                                      <span className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                        Hora
                                      </span>
                                      <TimeInput
                                        value={draftTime}
                                        onChange={setDraftTime}
                                        onKeyDown={handleEditKeyDown}
                                        placeholder="HH:MM"
                                        className="h-10 rounded-xl bg-background"
                                      />
                                    </label>
                                  </div>

                                  <div className="flex flex-col gap-3 border-t border-border/60 pt-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        className="h-9 w-full rounded-xl px-3 sm:w-auto"
                                        onClick={cancelEdit}
                                      >
                                        <X className="size-4" />
                                        Cancelar
                                      </Button>
                                      <Button
                                        type="submit"
                                        className="h-9 w-full rounded-xl px-3 sm:w-auto"
                                        disabled={!parseTimeInput(draftTime)}
                                      >
                                        <Check className="size-4" />
                                        Salvar
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </form>
                            ) : (
                              <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                                {record.type === "in"
                                  ? "Batida de entrada registrada"
                                  : "Batida de saida registrada"}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer.Root>
  )
}

type TasksDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeDayKey: string
  selectedDate: Date
}

function TasksDrawer({
  open,
  onOpenChange,
  activeDayKey,
  selectedDate,
}: TasksDrawerProps) {
  const { entries, addEntry, removeEntry, updateEntry } = useTaskEntries()
  const { projects, addProject } = useProjects()
  const { toast } = useToast()
  const [taskDialogOpen, setTaskDialogOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [isCreatingProject, setIsCreatingProject] = React.useState(false)
  const [newProjectName, setNewProjectName] = React.useState("")
  const [isSavingProject, setIsSavingProject] = React.useState(false)
  const [query, setQuery] = React.useState("")

  const activeDate = parseDayKey(activeDayKey) ?? selectedDate
  const activeEntries = React.useMemo(
    () => entries.filter((entry) => entry.date === activeDayKey),
    [activeDayKey, entries]
  )

  const projectOptions = React.useMemo(
    () =>
      [
        ...new Set([
          ...projects.map((project) => project.name),
          ...entries.map((entry) => entry.project.trim()),
        ]),
      ]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [entries, projects]
  )

  const form = useForm<CreateTaskValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      description: "",
      project: projectOptions[0] ?? "",
      date: activeDate ?? new Date(),
      duration: "",
      logged: false,
      jiraIssueKey: "",
      branchName: "",
    },
  })

  const logged = form.watch("logged") ?? false

  React.useEffect(() => {
    if (form.getValues("project")) return
    if (!projectOptions[0]) return
    form.setValue("project", projectOptions[0], { shouldValidate: true })
  }, [form, projectOptions])

  function openCreate() {
    setEditingId(null)
    setIsCreatingProject(false)
    setNewProjectName("")
    form.reset({
      description: "",
      project: projectOptions[0] ?? "",
      date: activeDate ?? new Date(),
      duration: "",
      logged: false,
      jiraIssueKey: "",
      branchName: "",
    })
    setTaskDialogOpen(true)
  }

  function openEdit(id: string) {
    const entry = entries.find((item) => item.id === id)
    if (!entry) return
    const occurredDate = dayjs(entry.date, "YYYY-MM-DD").toDate()
    const hours = Math.floor(entry.durationMinutes / 60)
    const minutes = entry.durationMinutes % 60
    const duration = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`

    setEditingId(id)
    setIsCreatingProject(false)
    setNewProjectName("")
    form.reset({
      description: entry.description,
      project: entry.project,
      date: occurredDate,
      duration,
      logged: entry.logged ?? false,
      jiraIssueKey: entry.jiraIssueKey ?? "",
      branchName: entry.branchName ?? "",
    })
    setTaskDialogOpen(true)
  }

  async function handleCreateProject() {
    const normalizedName = newProjectName.trim()
    if (!normalizedName) {
      toast({
        title: "Informe o nome do projeto",
        description: "Digite um nome para criar o projeto.",
        variant: "error",
      })
      return
    }

    setIsSavingProject(true)
    try {
      const saved = await addProject(normalizedName)
      form.setValue("project", saved.name, {
        shouldValidate: true,
        shouldDirty: true,
      })
      setNewProjectName("")
      setIsCreatingProject(false)
      toast({
        title: "Projeto criado",
        description: saved.name,
        variant: "success",
      })
    } catch {
      toast({
        title: "Nao foi possivel criar o projeto",
        description: "Tente novamente.",
        variant: "error",
      })
    } finally {
      setIsSavingProject(false)
    }
  }

  const filteredEntries = React.useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    if (!normalizedQuery) return activeEntries

    return activeEntries.filter((entry) => {
      const description = entry.description.toLocaleLowerCase()
      const project = entry.project.toLocaleLowerCase()
      return description.includes(normalizedQuery) || project.includes(normalizedQuery)
    })
  }, [activeEntries, query])

  const groups = React.useMemo(
    () => groupTasksByDate(filteredEntries),
    [filteredEntries]
  )

  const groupMinutes = groups.reduce(
    (acc, g) => acc + getMinutesForDate(filteredEntries, g.date),
    0
  )

  const handleCopyDescription = React.useCallback(
    async (description: string) => {
      const text = getTaskDescriptionText(description)
      if (!text) return

      try {
        await copyToClipboard(text)
        toast({
          title: "Descricao copiada",
          description: text,
          variant: "success",
        })
      } catch {
        toast({
          title: "Nao foi possivel copiar",
          description: "Tente novamente.",
          variant: "error",
        })
      }
    },
    [toast]
  )

  const handleCopyGroupDescriptions = React.useCallback(
    async (
      groupEntries: Array<{
        description: string
      }>
    ) => {
      const text = getGroupedDescriptions(groupEntries)
      if (!text) return

      try {
        await copyToClipboard(text)
        toast({
          title: "Descricoes copiadas",
          description: `${groupEntries.length} task(s) copiadas.`,
          variant: "success",
        })
      } catch {
        toast({
          title: "Nao foi possivel copiar",
          description: "Tente novamente.",
          variant: "error",
        })
      }
    },
    [toast]
  )

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <DrawerContent side="right" className="w-[min(26rem,90vw)] p-0">
        <div className="flex h-16 shrink-0 items-center justify-between border-b px-5">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <ListTodo className="size-4 text-primary" />
              <span className="text-sm font-semibold tracking-tight">
                Tasks e horas logadas
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {formatDurationMinutes(groupMinutes)} em {activeEntries.length}{" "}
              tarefa(s)
            </div>
          </div>
          <Drawer.Close asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-xl"
            >
              <span className="sr-only">Fechar</span>
              <X className="size-4" />
            </Button>
          </Drawer.Close>
        </div>

        <div className="space-y-5 p-5">
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              className="h-11 w-full rounded-2xl px-5"
              onClick={openCreate}
            >
              <Plus className="size-4" />
              Nova task
            </Button>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.currentTarget.value)}
                placeholder="Buscar por descricao ou projeto"
                className="h-11 rounded-2xl pl-10"
              />
            </div>
            {query.trim() ? (
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full rounded-2xl px-4"
                onClick={() => setQuery("")}
              >
                Limpar
              </Button>
            ) : null}
          </div>

          {groups.length === 0 ? (
            <div className="rounded-2xl border border-border/60 bg-card p-6 text-sm text-muted-foreground">
              Nenhuma task encontrada.
            </div>
          ) : (
            <div className="space-y-5">
              {groups.map((group) => {
                const groupDate = dayjs(group.date).toDate()
                const gMinutes = getMinutesForDate(filteredEntries, group.date)

                return (
                  <section key={group.date} className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="text-sm font-medium text-muted-foreground">
                        {formatDateWithWeekday(groupDate).split(",")[1]?.trim()}
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                          onClick={() =>
                            handleCopyGroupDescriptions(group.entries)
                          }
                        >
                          <Copy className="size-3.5" />
                          Copiar todas
                        </Button>
                        <div className="text-sm font-medium text-primary">
                          {formatDurationMinutes(gMinutes)} total
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {group.entries.map((entry) => {
                        const jiraBadge =
                          entry.logged && entry.jiraIssueKey ? (
                            <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-300">
                              {entry.jiraIssueKey}
                            </Badge>
                          ) : null

                        const branchBadge = entry.branchName ? (
                          <Badge className="max-w-full whitespace-normal break-all bg-muted font-mono text-muted-foreground">
                            {entry.branchName}
                          </Badge>
                        ) : null

                        return (
                          <Card
                            key={entry.id}
                            className="overflow-hidden border-border/70"
                          >
                            <CardContent className="space-y-4 p-5">
                              <div className="min-w-0 space-y-2">
                                <div className="break-words text-sm font-semibold">
                                  {entry.description}
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge className="bg-primary/10 text-primary">
                                    {entry.project}
                                  </Badge>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Clock className="size-3.5" />
                                    {dayjs(entry.date, "YYYY-MM-DD").format(
                                      "DD/MM"
                                    )}
                                  </div>
                                </div>
                                {jiraBadge || branchBadge ? (
                                  <div className="flex flex-wrap items-center gap-2">
                                    {jiraBadge}
                                    {branchBadge}
                                  </div>
                                ) : null}
                              </div>

                              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/60 pt-3">
                                <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm font-medium">
                                  <Clock className="size-4 text-muted-foreground" />
                                  {formatDurationMinutes(entry.durationMinutes)}
                                </div>

                                <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm font-medium">
                                  <span className="text-xs text-muted-foreground">
                                    Logged
                                  </span>
                                  <Switch
                                    checked={entry.logged}
                                    onCheckedChange={async (checked) => {
                                      try {
                                        await updateEntry(entry.id, {
                                          logged: checked,
                                          jiraIssueKey: checked
                                            ? entry.jiraIssueKey
                                            : "",
                                        })
                                      } catch {
                                        toast({
                                          title: "Nao foi possivel atualizar",
                                          description: "Tente novamente.",
                                          variant: "error",
                                        })
                                      }
                                    }}
                                  />
                                </div>

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  className="rounded-xl"
                                  onClick={() =>
                                    handleCopyDescription(entry.description)
                                  }
                                  aria-label="Copiar descricao"
                                >
                                  <Copy className="size-4" />
                                </Button>

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  className="rounded-xl"
                                  onClick={() => openEdit(entry.id)}
                                  aria-label="Editar"
                                >
                                  <Pencil className="size-4" />
                                </Button>

                                <ConfirmDialog
                                  title="Excluir task?"
                                  description="Essa acao nao pode ser desfeita."
                                  confirmLabel="Excluir"
                                  onConfirm={async () => {
                                    try {
                                      await removeEntry(entry.id)
                                      toast({
                                        title: "Task excluida",
                                        description: entry.description,
                                        variant: "success",
                                      })
                                    } catch {
                                      toast({
                                        title: "Nao foi possivel excluir",
                                        description: "Tente novamente.",
                                        variant: "error",
                                      })
                                    }
                                  }}
                                >
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    className="rounded-xl text-destructive hover:text-destructive"
                                    aria-label="Excluir"
                                  >
                                    <Trash2 className="size-4" />
                                  </Button>
                                </ConfirmDialog>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </section>
                )
              })}
            </div>
          )}
        </div>

        <Dialog.Root open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar task" : "Nova task"}</DialogTitle>
              <DialogDescription>
                Escolha projeto, data e duracao.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form
                className="mt-4 space-y-4"
                onSubmit={form.handleSubmit(async (values) => {
                  const durationMinutes = durationToMinutes(values.duration)
                  if (durationMinutes <= 0) {
                    form.setError("duration", {
                      type: "validate",
                      message: "Duracao deve ser > 00:00",
                    })
                    return
                  }

                  const time = parseTimeInput(values.duration)
                  if (!time) {
                    form.setError("duration", {
                      type: "validate",
                      message: "Use HH:MM",
                    })
                    return
                  }

                  const occurredAt = dayjs(values.date)
                    .hour(0)
                    .minute(0)
                    .second(0)
                    .millisecond(0)
                    .toDate()
                  const payload = {
                    description: values.description.trim(),
                    project: values.project.trim(),
                    occurredAt: occurredAt.toISOString(),
                    date: getDayKey(occurredAt),
                    durationMinutes,
                    logged: Boolean(values.logged),
                    jiraIssueKey: values.logged
                      ? (values.jiraIssueKey ?? "").trim()
                      : "",
                    branchName: (values.branchName ?? "").trim(),
                  }

                  if (editingId) {
                    try {
                      await updateEntry(editingId, payload)
                      toast({
                        title: "Task atualizada",
                        description: payload.description,
                        variant: "success",
                      })
                    } catch {
                      toast({
                        title: "Nao foi possivel atualizar",
                        description: "Tente novamente.",
                        variant: "error",
                      })
                      return
                    }
                  } else {
                    try {
                      await addEntry(payload)
                      toast({
                        title: "Task criada",
                        description: payload.description,
                        variant: "success",
                      })
                    } catch {
                      toast({
                        title: "Nao foi possivel criar",
                        description: "Tente novamente.",
                        variant: "error",
                      })
                      return
                    }
                  }

                  setTaskDialogOpen(false)
                })}
              >
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descricao</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ex.: Atualizar layout do dashboard"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="project"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Projeto</FormLabel>
                      <FormControl>
                        <Select.Root
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um projeto" />
                          </SelectTrigger>
                          <SelectContent>
                            {projectOptions.map((project) => (
                              <SelectItem key={project} value={project}>
                                {project}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select.Root>
                      </FormControl>
                      <div className="mt-3 space-y-3 rounded-2xl border border-dashed border-border p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm text-muted-foreground">
                            Nao encontrou o projeto?
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setIsCreatingProject((current) => !current)
                            }
                          >
                            <Plus className="size-4" />
                            {isCreatingProject ? "Cancelar" : "Criar projeto"}
                          </Button>
                        </div>

                        {isCreatingProject ? (
                          <div className="flex flex-col gap-3 sm:flex-row">
                            <Input
                              value={newProjectName}
                              onChange={(event) =>
                                setNewProjectName(event.target.value)
                              }
                              placeholder="Nome do projeto"
                              className="h-11 rounded-2xl"
                              onKeyDown={(event) => {
                                if (event.key !== "Enter") return
                                event.preventDefault()
                                void handleCreateProject()
                              }}
                            />
                            <Button
                              type="button"
                              className="h-11 rounded-2xl px-5"
                              onClick={() => void handleCreateProject()}
                              disabled={isSavingProject}
                            >
                              Salvar
                            </Button>
                          </div>
                        ) : null}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col gap-4 sm:flex-row">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Data</FormLabel>
                        <FormControl>
                          <DatePicker
                            value={field.value}
                            onChange={field.onChange}
                            className="h-11 rounded-2xl"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Tempo gasto</FormLabel>
                        <FormControl>
                          <TimeInput
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="HH:MM"
                            className="h-11 rounded-2xl"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="logged"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-4 rounded-2xl border border-input p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Logged</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Ja logado no Jira
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value ?? false}
                          onCheckedChange={(checked) => {
                            field.onChange(checked)
                            if (!checked) {
                              form.setValue("jiraIssueKey", "", {
                                shouldValidate: true,
                              })
                            }
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="jiraIssueKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue do Jira</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex.: ABC-123"
                          className="h-11 rounded-2xl"
                          disabled={!logged}
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="branchName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branch</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex.: feature/ABC-123-task-logging"
                          className="h-11 rounded-2xl"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 rounded-2xl px-4"
                    onClick={() => setTaskDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="h-10 rounded-2xl px-5">
                    Salvar
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog.Root>
      </DrawerContent>
    </Drawer.Root>
  )
}
