import * as React from "react"
import { Check, LogIn, LogOut, Pencil, Trash2, X } from "lucide-react"

import { ConfirmDialog } from "@/components/app/confirm-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TimeInput } from "@/components/ui/time-input"
import { useToast } from "@/hooks/use-toast"
import { usePunchRecords } from "@/hooks/use-punch-records"
import {
  getRecordsForDay,
  getWorkedMinutesForDay,
  getWorkedMinutesForDayClosed,
} from "@/lib/punch"
import { dayjs } from "@/lib/dayjs"
import { parseTimeInput } from "@/lib/time-input"
import {
  formatClockTime,
  formatDateWithWeekday,
  formatDurationMinutes,
  formatSeconds,
  getDayKey,
  parseDayKey,
} from "@/lib/time"

type PointPageProps = {
  headingLevel?: "h1" | "h2"
  activeDayKey?: string
}

export function PointPage({ headingLevel = "h1", activeDayKey }: PointPageProps) {
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

  const dayKey = activeDayKey ?? getDayKey(now)
  const dayDate = React.useMemo(() => parseDayKey(dayKey) ?? now, [dayKey, now])
  const isToday = dayKey === getDayKey(now)

  const todayRecords = getRecordsForDay(records, dayKey).sort((a, b) =>
    a.timestamp < b.timestamp ? -1 : 1
  )

  const totalWorkedMinutes = isToday
    ? getWorkedMinutesForDay(records, dayKey, now)
    : getWorkedMinutesForDayClosed(records, dayKey)
  const lastRecord = todayRecords.at(-1)
  const nextType = lastRecord?.type === "in" ? "out" : "in"

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
        description: `${draftType === "in" ? "Entrada" : "Saída"} • ${formatClockTime(next)}`,
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
        label: "Clock out",
        Icon: LogOut,
        className:
          "h-12 rounded-2xl bg-rose-500 px-6 text-base text-white shadow-sm hover:bg-rose-600",
      }
      : {
        label: "Clock in",
        Icon: LogIn,
        className:
          "h-12 rounded-2xl bg-emerald-500 px-6 text-base text-white shadow-sm hover:bg-emerald-600",
      }

  return (
    <div className="space-y-8">
      <header className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
        <div>
          {React.createElement(
            headingLevel,
            { className: "text-3xl font-semibold tracking-tight" },
            "Time Clock"
          )}
          <p className="mt-2 text-sm text-muted-foreground">
            Track your clock-in and clock-out
          </p>
        </div>
        <div className="text-sm font-medium text-primary">
          {formatDurationMinutes(totalWorkedMinutes)} today
        </div>
      </header>

      <Card className="overflow-hidden">
        <CardContent className="p-8">
          <div className="mx-auto flex max-w-xl flex-col items-center text-center">
            <div className="flex items-end justify-center gap-3">
              <span className="text-7xl font-light tracking-tight">
                {formatClockTime(now)}
              </span>
              <span className="pb-3 text-3xl font-light text-muted-foreground">
                {formatSeconds(now)}
              </span>
            </div>

            <div className="mt-2 text-sm text-muted-foreground">
              {formatDateWithWeekday(dayDate)}
            </div>

            <div className="mt-6">
              <Button
                onClick={async () => {
                  const timestamp = isToday
                    ? now
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
                      description: `${nextType === "in" ? "Entrada" : "Saída"} • ${formatClockTime(timestamp)}`,
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
                className={primaryAction.className}
              >
                <primaryAction.Icon className="size-4" />
                {primaryAction.label}
              </Button>

              <div className="mt-3 text-xs text-muted-foreground">
                {lastRecord
                  ? `Last record: ${lastRecord.type === "in" ? "Clock in" : "Clock out"
                  } at ${formatClockTime(new Date(lastRecord.timestamp))}`
                  : "No records yet"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold tracking-tight text-muted-foreground">
            TODAY'S RECORDS
          </h2>
          <span className="text-sm text-muted-foreground">
            {todayRecords.length} records
          </span>
        </div>

        <Card>
          <CardContent className="p-0">
            {todayRecords.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">
                No records for today yet.
              </div>
            ) : (
              <ul className="divide-y">
                {todayRecords.map((record) => {
                  const isEditing = editingId === record.id

                  return (
                    <li key={record.id} className="p-5">
                      <div className="flex items-start gap-4">
                        <div
                          className={
                            record.type === "in"
                              ? "grid size-9 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "grid size-9 place-items-center rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400"
                          }
                        >
                          {record.type === "in" ? (
                            <LogIn className="size-4" />
                          ) : (
                            <LogOut className="size-4" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium">
                                {record.type === "in" ? "Clock in" : "Clock out"}
                              </div>

                              {isEditing ? (
                                <form
                                  className="mt-3 rounded-2xl border border-border/70 bg-muted/30 p-4"
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
                                        Clock in
                                      </Button>
                                      <Button
                                        type="button"
                                        variant={draftType === "out" ? "secondary" : "outline"}
                                        size="sm"
                                        className="h-9 rounded-xl px-3"
                                        onClick={() => setDraftType("out")}
                                      >
                                        Clock out
                                      </Button>
                                    </div>

                                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_8.5rem]">
                                      <label className="space-y-1.5">
                                        <span className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                          Date
                                        </span>
                                        <Input
                                          type="date"
                                          value={getDayKey(draftDate)}
                                          onChange={(event) => {
                                            const next = parseDayKey(event.currentTarget.value)
                                            if (!next) return
                                            setDraftDate(next)
                                          }}
                                          onKeyDown={handleEditKeyDown}
                                          className="h-10 rounded-xl bg-background"
                                        />
                                      </label>

                                      <label className="space-y-1.5">
                                        <span className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                          Time
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
                                      <p className="text-xs text-muted-foreground">
                                        Press Enter in date or time to save changes.
                                      </p>

                                      <div className="flex items-center justify-end gap-2">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          className="h-9 rounded-xl px-3"
                                          onClick={cancelEdit}
                                        >
                                          <X className="size-4" />
                                          Cancel
                                        </Button>
                                        <Button
                                          type="submit"
                                          className="h-9 rounded-xl px-3"
                                          disabled={!parseTimeInput(draftTime)}
                                        >
                                          <Check className="size-4" />
                                          Save
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </form>
                              ) : (
                                <div className="text-xs text-muted-foreground">
                                  {formatDateWithWeekday(new Date(record.timestamp))} •{" "}
                                  {formatClockTime(new Date(record.timestamp))}
                                </div>
                              )}
                            </div>

                            {!isEditing ? (
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  className="rounded-xl"
                                  onClick={() => startEdit(record.id)}
                                  aria-label="Edit"
                                >
                                  <Pencil className="size-4" />
                                </Button>
                                <ConfirmDialog
                                  title="Delete record?"
                                  description="This action cannot be undone."
                                  confirmLabel="Delete"
                                  onConfirm={async () => {
                                    try {
                                      await removeRecord(record.id)
                                      toast({
                                        title: "Batida excluída",
                                        description: `${record.type === "in" ? "Entrada" : "Saída"} • ${formatClockTime(
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
                                    aria-label="Delete"
                                  >
                                    <Trash2 className="size-4" />
                                  </Button>
                                </ConfirmDialog>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
