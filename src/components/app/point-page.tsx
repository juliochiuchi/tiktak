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

export function PointPage({ activeDayKey }: PointPageProps) {
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
  const totalWorkedMinutesClosed = getWorkedMinutesForDayClosed(records, dayKey)
  const targetWorkedMinutes = 8 * 60
  const firstEntryRecord = todayRecords.find((record) => record.type === "in")
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
        title: "Sucesso!",
        description: `${draftType === "in" ? "Entrada" : "Saída"} atualizada para ${formatClockTime(next)}.`,
        variant: "success",
      })
      setEditingId(null)
    } catch {
      toast({
        title: "Não foi possível atualizar",
        description: "Tente novamente.",
        variant: "error",
      })
    }
  }

  const primaryAction =
    nextType === "out"
      ? {
        label: "Registrar saída",
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
    <div className="space-y-8">
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
              {formatDateWithWeekday(dayDate)}
            </div>

            <div className="mt-6 w-full max-w-md">
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
                      title: "Sucesso!",
                      description: `${nextType === "in" ? "Entrada" : "Saída"} registrada às ${formatClockTime(timestamp)}.`,
                      variant: "success",
                    })
                  } catch {
                    toast({
                      title: "Não foi possível registrar",
                      description: "Tente novamente.",
                      variant: "error",
                    })
                  }
                }}
                className={`${primaryAction.className} w-full justify-center px-5 sm:w-auto sm:min-w-52`}
              >
                <primaryAction.Icon className="size-4" />
                {primaryAction.label}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold tracking-tight text-muted-foreground">
            REGISTROS DO DIA
          </h2>
          <p className="text-sm text-muted-foreground">
            Resumo das horas e histórico das batidas do dia selecionado.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
          <Card className="overflow-hidden border-border/70 bg-card/90">
            <CardContent className="p-5">
              <div className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Soma de horas trabalhadas
              </div>
              <div className="mt-3 text-4xl font-semibold tracking-tight">
                {formatDurationMinutes(totalWorkedMinutes)}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Meta do dia: 8h trabalhadas
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-border/70 bg-card/90">
            <CardContent className="p-5">
              <div className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Último ponto sugerido
              </div>
              <div className="mt-3 text-2xl font-semibold tracking-tight">
                {suggestedLastPunch}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Horário para fechar 8h no total.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden border-border/70 bg-card/90">
          <CardContent className="p-5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Referente ao dia
                </div>
                <div className="mt-2 text-xl font-semibold tracking-tight">
                  {selectedWeekday}
                </div>
              </div>
              <div className="text-sm font-medium text-muted-foreground">
                {selectedDateLabel}
              </div>
            </div>
          </CardContent>
        </Card>

        {todayRecords.length === 0 ? (
          <Card className="overflow-hidden border-border/70 bg-card/90">
            <CardContent className="p-6 text-sm text-muted-foreground">
              Nenhuma batida registrada para este dia.
            </CardContent>
          </Card>
        ) : (
          <ul className="grid gap-3">
            {todayRecords.map((record) => {
              const isEditing = editingId === record.id
              const recordDate = new Date(record.timestamp)

              return (
                <li key={record.id}>
                  <Card className="overflow-hidden border-border/70 bg-card/90">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex min-w-0 items-start gap-4">
                            <div
                              className={
                                record.type === "in"
                                  ? "grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                  : "grid size-11 shrink-0 place-items-center rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400"
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
                              <div className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
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
                                description="Essa ação não pode ser desfeita."
                                confirmLabel="Excluir"
                                onConfirm={async () => {
                                  try {
                                    await removeRecord(record.id)
                                    toast({
                                      title: "Sucesso!",
                                      description: `${record.type === "in" ? "Entrada" : "Saída"} excluída das ${formatClockTime(
                                        new Date(record.timestamp)
                                      )}.`,
                                      variant: "success",
                                    })
                                  } catch {
                                    toast({
                                      title: "Não foi possível excluir",
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
                                  Saída
                                </Button>
                              </div>

                              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_8.5rem]">
                                <label className="space-y-1.5">
                                  <span className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                    Data
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
                                <p className="text-xs text-muted-foreground">
                                  Pressione Enter em data ou hora para salvar.
                                </p>

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
                          <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                            {record.type === "in"
                              ? "Batida de entrada registrada"
                              : "Batida de saída registrada"}
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
      </section>
    </div>
  )
}
