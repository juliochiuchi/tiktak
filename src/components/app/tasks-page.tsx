import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Clock, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { ConfirmDialog } from "@/components/app/confirm-dialog"
import { DatePicker } from "@/components/app/date-picker"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TimeInput } from "@/components/ui/time-input"
import { Textarea } from "@/components/ui/textarea"
import { useTaskEntries } from "@/hooks/use-task-entries"
import { groupTasksByDate, getMinutesForDate } from "@/lib/tasks"
import {
  formatDateSection,
  formatDurationMinutes,
  getDayKey,
  parseDayKey,
} from "@/lib/time"
import { dayjs } from "@/lib/dayjs"
import { parseTimeInput } from "@/lib/time-input"

const createTaskSchema = z.object({
  description: z.string().min(1, "Enter a description"),
  project: z.string().min(1, "Select a project"),
  date: z.date(),
  duration: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM"),
})

type CreateTaskValues = z.infer<typeof createTaskSchema>

function durationToMinutes(value: string) {
  const [hoursText, minutesText] = value.split(":")
  const hours = Number(hoursText ?? 0)
  const minutes = Number(minutesText ?? 0)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0
  return Math.max(0, hours) * 60 + Math.min(59, Math.max(0, minutes))
}

type TasksPageProps = {
  headingLevel?: "h1" | "h2"
  activeDayKey?: string
}

export function TasksPage({
  headingLevel = "h1",
  activeDayKey,
}: TasksPageProps) {
  const { entries, addEntry, removeEntry, updateEntry } = useTaskEntries()
  const [open, setOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const queryKey = activeDayKey ?? "__all__"
  const [queryByKey, setQueryByKey] = React.useState<Record<string, string>>({})
  const query = queryByKey[queryKey] ?? ""
  const setQuery = React.useCallback(
    (next: string) => {
      setQueryByKey((current) => ({ ...current, [queryKey]: next }))
    },
    [queryKey]
  )
  const activeDate = React.useMemo(
    () => (activeDayKey ? parseDayKey(activeDayKey) : null),
    [activeDayKey]
  )
  const activeEntries = React.useMemo(
    () =>
      activeDayKey ? entries.filter((entry) => entry.date === activeDayKey) : entries,
    [activeDayKey, entries]
  )

  const projects = React.useMemo(
    () => ["Website Redesign", "Mobile App", "Internal Tools"],
    []
  )

  const form = useForm<CreateTaskValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      description: "",
      project: projects[0] ?? "General",
      date: activeDate ?? new Date(),
      duration: "",
    },
  })

  React.useEffect(() => {
    if (form.getValues("project")) return
    form.setValue("project", projects[0] ?? "General", { shouldValidate: true })
  }, [form, projects])

  function openCreate() {
    setEditingId(null)
    form.reset({
      description: "",
      project: projects[0] ?? "General",
      date: activeDate ?? new Date(),
      duration: "",
    })
    setOpen(true)
  }

  function openEdit(id: string) {
    const entry = entries.find((item) => item.id === id)
    if (!entry) return
    const occurredDate = dayjs(entry.date, "YYYY-MM-DD").toDate()
    const hours = Math.floor(entry.durationMinutes / 60)
    const minutes = entry.durationMinutes % 60
    const duration = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`

    setEditingId(id)
    form.reset({
      description: entry.description,
      project: entry.project,
      date: occurredDate,
      duration,
    })
    setOpen(true)
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

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {React.createElement(
            headingLevel,
            { className: "text-3xl font-semibold tracking-tight" },
            "Tasks"
          )}
          <p className="mt-2 text-sm text-muted-foreground">
            Log your work and time spent
          </p>
        </div>

        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <Button
              type="button"
              className="h-11 rounded-2xl px-5"
              onClick={openCreate}
            >
              <Plus className="size-4" />
              New task
            </Button>
          </Dialog.Trigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit task" : "New task"}</DialogTitle>
              <DialogDescription>
                Choose project, date & time, and duration.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form
                className="mt-4 space-y-4"
                onSubmit={form.handleSubmit((values) => {
                  const durationMinutes = durationToMinutes(values.duration)
                  if (durationMinutes <= 0) {
                    form.setError("duration", {
                      type: "validate",
                      message: "Duration must be > 00:00",
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
                  }

                  if (editingId) {
                    updateEntry(editingId, payload)
                  } else {
                    addEntry(payload)
                  }

                  setOpen(false)
                })}
              >
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="E.g. Update dashboard layout" {...field} />
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
                      <FormLabel>Project</FormLabel>
                      <FormControl>
                        <Select.Root value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a project" />
                          </SelectTrigger>
                          <SelectContent>
                            {projects.map((project) => (
                              <SelectItem key={project} value={project}>
                                {project}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select.Root>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
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
                    <FormItem>
                      <FormLabel>Time spent</FormLabel>
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

                <DialogFooter className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 rounded-2xl px-4"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="h-10 rounded-2xl px-5">
                    Save
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog.Root>
      </header>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Search by description or project"
            className="h-11 rounded-2xl pl-10"
          />
        </div>
        {query.trim() ? (
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-2xl px-4"
            onClick={() => setQuery("")}
          >
            Clear
          </Button>
        ) : null}
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No tasks found.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => {
            const groupDate = dayjs(group.date).toDate()
            const groupMinutes = getMinutesForDate(filteredEntries, group.date)

            return (
              <section key={group.date} className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm font-medium text-muted-foreground">
                    {formatDateSection(groupDate)}
                  </div>
                  <div className="text-sm font-medium text-primary">
                    {formatDurationMinutes(groupMinutes)} total
                  </div>
                </div>

                <div className="space-y-3">
                  {group.entries.map((entry) => (
                    <Card key={entry.id} className="overflow-hidden">
                      <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-2">
                          <div className="text-sm font-semibold">
                            {entry.description}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className="bg-primary/10 text-primary">
                              {entry.project}
                            </Badge>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="size-3.5" />
                              {dayjs(entry.date, "YYYY-MM-DD").format("DD/MM")}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-start gap-2 sm:justify-end">
                          <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm font-medium">
                            <Clock className="size-4 text-muted-foreground" />
                            {formatDurationMinutes(entry.durationMinutes)}
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="rounded-xl"
                            onClick={() => openEdit(entry.id)}
                            aria-label="Edit"
                          >
                            <Pencil className="size-4" />
                          </Button>

                          <ConfirmDialog
                            title="Delete task?"
                            description="This action cannot be undone."
                            confirmLabel="Delete"
                            onConfirm={() => removeEntry(entry.id)}
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
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
