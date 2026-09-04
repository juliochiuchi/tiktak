import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Clock, Copy, Pencil, Plus, Search, Trash2 } from "lucide-react"
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
import { Switch } from "@/components/ui/switch"
import { TimeInput } from "@/components/ui/time-input"
import { Textarea } from "@/components/ui/textarea"
import { useProjects } from "@/hooks/use-projects"
import { useToast } from "@/hooks/use-toast"
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
  description: z.string().min(1, "Informe uma descrição"),
  project: z.string().min(1, "Selecione um projeto"),
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

type TasksPageProps = {
  headingLevel?: "h1" | "h2"
  activeDayKey?: string
}

export function TasksPage({
  headingLevel = "h1",
  activeDayKey,
}: TasksPageProps) {
  const { entries, addEntry, removeEntry, updateEntry } = useTaskEntries()
  const { projects, addProject } = useProjects()
  const { toast } = useToast()
  const isWorkdayView = Boolean(activeDayKey)
  const [open, setOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [isCreatingProject, setIsCreatingProject] = React.useState(false)
  const [newProjectName, setNewProjectName] = React.useState("")
  const [isSavingProject, setIsSavingProject] = React.useState(false)
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

  const projectOptions = React.useMemo(
    () =>
      [...new Set([...projects.map((project) => project.name), ...entries.map((entry) => entry.project.trim())])]
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
    setOpen(true)
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
      form.setValue("project", saved.name, { shouldValidate: true, shouldDirty: true })
      setNewProjectName("")
      setIsCreatingProject(false)
      toast({
        title: "Sucesso!",
        description: `Projeto "${saved.name}" foi criado.`,
        variant: "success",
      })
    } catch {
      toast({
        title: "Não foi possível criar o projeto",
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

  const handleCopyDescription = React.useCallback(
    async (description: string) => {
      const text = getTaskDescriptionText(description)
      if (!text) return

      try {
        await copyToClipboard(text)
        toast({
          title: "Sucesso!",
          description: "Descrição copiada para a área de transferência.",
          variant: "success",
        })
      } catch {
        toast({
          title: "Não foi possível copiar",
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
          title: "Sucesso!",
          description: `${groupEntries.length} descrição(ões) copiada(s).`,
          variant: "success",
        })
      } catch {
        toast({
          title: "Não foi possível copiar",
          description: "Tente novamente.",
          variant: "error",
        })
      }
    },
    [toast]
  )

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {React.createElement(
            headingLevel,
            { className: "text-3xl font-semibold tracking-tight" },
            "Tarefas"
          )}
          <p className="mt-2 text-sm text-muted-foreground">
            Registre seu trabalho e o tempo gasto
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
              Nova tarefa
            </Button>
          </Dialog.Trigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar tarefa" : "Nova tarefa"}</DialogTitle>
              <DialogDescription>
                Escolha o projeto, data, hora e duração.
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
                      message: "Duração deve ser > 00:00",
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
                    jiraIssueKey: (values.jiraIssueKey ?? "").trim(),
                    branchName: (values.branchName ?? "").trim(),
                  }

                  if (editingId) {
                    try {
                      await updateEntry(editingId, payload)
                      toast({
                        title: "Sucesso!",
                        description: "A tarefa foi atualizada.",
                        variant: "success",
                      })
                    } catch {
                      toast({
                        title: "Não foi possível atualizar",
                        description: "Tente novamente.",
                        variant: "error",
                      })
                      return
                    }
                  } else {
                    try {
                      await addEntry(payload)
                      toast({
                        title: "Sucesso!",
                        description: "A tarefa foi cadastrada.",
                        variant: "success",
                      })
                    } catch {
                      toast({
                        title: "Não foi possível criar",
                        description: "Tente novamente.",
                        variant: "error",
                      })
                      return
                    }
                  }

                  setOpen(false)
                })}
              >
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Ex.: Atualizar layout do painel" {...field} />
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
                        <Select.Root value={field.value} onValueChange={field.onChange}>
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
                            Não encontrou o projeto na lista?
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsCreatingProject((current) => !current)}
                          >
                            <Plus className="size-4" />
                            {isCreatingProject ? "Cancelar" : "Criar projeto"}
                          </Button>
                        </div>

                        {isCreatingProject ? (
                          <div className="flex flex-col gap-3 sm:flex-row">
                            <Input
                              value={newProjectName}
                              onChange={(event) => setNewProjectName(event.target.value)}
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
                              Salvar projeto
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
                        <FormLabel>Registrado</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Já registrado no Jira
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value ?? false}
                          onCheckedChange={(checked) => {
                            field.onChange(checked)
                            if (!checked) {
                              form.setValue("jiraIssueKey", "", { shouldValidate: true })
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
                      <FormLabel>Tarefa Jira</FormLabel>
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
                          placeholder="Ex.: feature/ABC-123-registro-tarefa"
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
                    onClick={() => setOpen(false)}
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
      </header>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Buscar por descrição ou projeto"
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
            Limpar
          </Button>
        ) : null}
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Nenhuma tarefa encontrada.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => {
            const groupDate = dayjs(group.date).toDate()
            const groupMinutes = getMinutesForDate(filteredEntries, group.date)

            return (
              <section key={group.date} className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm font-medium text-muted-foreground">
                    {formatDateSection(groupDate)}
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => handleCopyGroupDescriptions(group.entries)}
                    >
                      <Copy className="size-3.5" />
                      Copiar todas
                    </Button>
                    <div className="text-sm font-medium text-primary">
                      {formatDurationMinutes(groupMinutes)} total
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {group.entries.map((entry) => (
                    <Card key={entry.id} className="overflow-hidden">
                      {(() => {
                        const jiraBadge = entry.jiraIssueKey ? (
                          <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-300">
                            {entry.jiraIssueKey}
                          </Badge>
                        ) : null

                        const branchBadge = entry.branchName ? (
                          <Badge className="max-w-full whitespace-normal break-all bg-muted font-mono text-muted-foreground sm:max-w-[16rem] sm:overflow-hidden sm:text-ellipsis sm:whitespace-nowrap">
                            {entry.branchName}
                          </Badge>
                        ) : null

                        const content = isWorkdayView ? (
                          <div className="min-w-0 space-y-2">
                            <div className="wrap-break-word text-sm font-semibold">
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
                            {jiraBadge || branchBadge ? (
                              <div className="flex flex-wrap items-center gap-2">
                                {jiraBadge}
                                {branchBadge}
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="wrap-break-word text-sm font-semibold">
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
                              {jiraBadge}
                              {branchBadge}
                            </div>
                          </div>
                        )

                        const actionItems = (
                          <>
                            <div className="inline-flex shrink-0 items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm font-medium">
                              <Clock className="size-4 text-muted-foreground" />
                              {formatDurationMinutes(entry.durationMinutes)}
                            </div>

                            <div className="inline-flex shrink-0 items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm font-medium">
                              <span className="text-xs text-muted-foreground">
                                Logado
                              </span>
                              <Switch
                                checked={entry.logged}
                                onCheckedChange={async (checked) => {
                                  try {
                                    await updateEntry(entry.id, {
                                      logged: checked,
                                      jiraIssueKey: checked ? entry.jiraIssueKey : "",
                                    })
                                  } catch {
                                    toast({
                                      title: "Não foi possível atualizar",
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
                              className="shrink-0 rounded-xl"
                              onClick={() => handleCopyDescription(entry.description)}
                              aria-label="Copiar descrição"
                            >
                              <Copy className="size-4" />
                            </Button>

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="shrink-0 rounded-xl"
                              onClick={() => openEdit(entry.id)}
                              aria-label="Editar"
                            >
                              <Pencil className="size-4" />
                            </Button>

                            <ConfirmDialog
                              title="Excluir tarefa?"
                              description="Esta ação não pode ser desfeita."
                              confirmLabel="Excluir"
                              onConfirm={async () => {
                                try {
                                  await removeEntry(entry.id)
                                  toast({
                                    title: "Sucesso!",
                                    description: "A tarefa foi excluída.",
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
                                className="shrink-0 rounded-xl text-destructive hover:text-destructive"
                                aria-label="Excluir"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </ConfirmDialog>
                          </>
                        )

                        if (isWorkdayView) {
                          return (
                            <CardContent className="space-y-4 p-6">
                              {content}
                              <div className="flex flex-nowrap items-center justify-end gap-2 border-t border-border/60 pt-3">
                                {actionItems}
                              </div>
                            </CardContent>
                          )
                        }

                        return (
                          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-start">
                            {content}
                            <div className="flex flex-nowrap items-center justify-start gap-2 sm:ml-auto sm:justify-end">
                              {actionItems}
                            </div>
                          </CardContent>
                        )
                      })()}
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
