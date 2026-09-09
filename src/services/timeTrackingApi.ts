import { dayjs } from "@/lib/dayjs"
import {
  projectSchema,
  projectsSchema,
  punchRecordsSchema,
  taskEntriesSchema,
  vacationSchema,
  vacationsSchema,
  type Project,
  type PunchRecord,
  type TaskEntry,
  type Vacation,
} from "@/lib/time-tracking"
import { supabaseHttp } from "@/services/supabaseHttp"

type TaskEntryRow = {
  id: string
  description: string
  project: string
  entry_date: string
  occurred_at: string
  duration_minutes: number
  logged: boolean
  jira_issue_key: string | null
  branch_name: string | null
  created_at: string
}

type PunchRecordRow = {
  id: string
  punch_type: "in" | "out" | "holiday"
  punched_at: string | null
  holiday: boolean | null
  created_at?: string | null
}

type ProjectRow = {
  id: string
  name: string
  created_at: string
}

type VacationRow = {
  id: string
  init_date: string
  end_date: string
  created_at: string
}

function toTaskEntry(row: TaskEntryRow): TaskEntry {
  return {
    id: row.id,
    description: row.description,
    project: row.project,
    date: row.entry_date,
    occurredAt: row.occurred_at,
    durationMinutes: row.duration_minutes,
    logged: row.logged,
    jiraIssueKey: row.jira_issue_key ?? "",
    branchName: row.branch_name ?? "",
    createdAt: row.created_at,
  }
}

function toTaskEntryRow(entry: TaskEntry): TaskEntryRow {
  return {
    id: entry.id,
    description: entry.description,
    project: entry.project,
    entry_date: entry.date,
    occurred_at: entry.occurredAt,
    duration_minutes: entry.durationMinutes,
    logged: entry.logged,
    jira_issue_key: entry.jiraIssueKey,
    branch_name: entry.branchName,
    created_at: entry.createdAt,
  }
}

function toPunchRecord(row: PunchRecordRow): PunchRecord {
  const isHoliday = (row.holiday ?? false) || row.punch_type === "holiday"
  const fallback = dayjs().toISOString()
  const referenceDate = row.punched_at ?? row.created_at ?? fallback
  const timestamp: string = isHoliday
    ? dayjs(referenceDate).startOf("day").toISOString()
    : (row.punched_at ?? dayjs(referenceDate).toISOString())

  return {
    id: row.id,
    type: row.punch_type,
    timestamp,
    holiday: isHoliday,
  }
}

type PunchRecordWriteRow = {
  id: string
  punch_type: "in" | "out" | "holiday"
  punched_at: string
  holiday: boolean
  created_at: string
}

function toPunchRecordRow(record: PunchRecord): PunchRecordWriteRow {
  const isHoliday = record.holiday ?? record.type === "holiday"
  if (!record.timestamp) {
    throw new Error(
      `PunchRecord timestamp is required (type=${record.type}, id=${record.id})`
    )
  }
  return {
    id: record.id,
    punch_type: record.type,
    punched_at: record.timestamp,
    holiday: isHoliday,
    created_at: new Date().toISOString(),
  }
}

function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
  }
}

function toProjectRow(project: Project): ProjectRow {
  return {
    id: project.id,
    name: project.name,
    created_at: project.createdAt,
  }
}

function toVacation(row: VacationRow): Vacation {
  return {
    id: row.id,
    initDate: row.init_date ? dayjs(row.init_date).format("YYYY-MM-DD") : row.init_date,
    endDate: row.end_date ? dayjs(row.end_date).format("YYYY-MM-DD") : row.end_date,
    createdAt: row.created_at,
  }
}

function toVacationRow(vacation: Vacation): VacationRow {
  return {
    id: vacation.id,
    init_date: vacation.initDate,
    end_date: vacation.endDate,
    created_at: vacation.createdAt,
  }
}

export async function listTaskEntries(): Promise<TaskEntry[]> {
  const response = await supabaseHttp.get<TaskEntryRow[]>("/task_entries", {
    params: { select: "*", order: "created_at.desc" },
  })
  return taskEntriesSchema.parse(response.data.map(toTaskEntry))
}

export async function createTaskEntry(entry: TaskEntry): Promise<TaskEntry> {
  const response = await supabaseHttp.post<TaskEntryRow[]>("/task_entries", toTaskEntryRow(entry), {
    params: { select: "*" },
    headers: { Prefer: "return=representation" },
  })
  const row = response.data[0]
  return taskEntriesSchema.element.parse(toTaskEntry(row))
}

export async function updateTaskEntry(
  id: string,
  updates: Partial<Omit<TaskEntry, "id">>
): Promise<TaskEntry> {
  const rowUpdates: Partial<TaskEntryRow> = {}
  if (updates.description !== undefined) rowUpdates.description = updates.description
  if (updates.project !== undefined) rowUpdates.project = updates.project
  if (updates.date !== undefined) rowUpdates.entry_date = updates.date
  if (updates.occurredAt !== undefined) rowUpdates.occurred_at = updates.occurredAt
  if (updates.durationMinutes !== undefined) rowUpdates.duration_minutes = updates.durationMinutes
  if (updates.logged !== undefined) rowUpdates.logged = updates.logged
  if (updates.jiraIssueKey !== undefined) rowUpdates.jira_issue_key = updates.jiraIssueKey
  if (updates.branchName !== undefined) rowUpdates.branch_name = updates.branchName
  if (updates.createdAt !== undefined) rowUpdates.created_at = updates.createdAt

  const response = await supabaseHttp.patch<TaskEntryRow[]>("/task_entries", rowUpdates, {
    params: { id: `eq.${id}`, select: "*" },
    headers: { Prefer: "return=representation" },
  })
  const row = response.data[0]
  return taskEntriesSchema.element.parse(toTaskEntry(row))
}

export async function deleteTaskEntry(id: string): Promise<void> {
  await supabaseHttp.delete("/task_entries", { params: { id: `eq.${id}` } })
}

export async function migrateLocalTaskEntriesToSupabase(options?: {
  storageKey?: string
}): Promise<void> {
  if (typeof window === "undefined") return
  const storageKey = options?.storageKey ?? "tiktak.task-entries.v3"
  const raw = window.localStorage.getItem(storageKey)
  if (!raw) return

  const parsed = taskEntriesSchema.safeParse(JSON.parse(raw))
  if (!parsed.success || parsed.data.length === 0) return

  const rows = parsed.data.map(toTaskEntryRow)
  await supabaseHttp.post("/task_entries", rows, {
    params: { select: "id", on_conflict: "id" },
    headers: { Prefer: "resolution=merge-duplicates" },
  })
  await upsertProjectsFromNames(parsed.data.map((entry) => entry.project))
  window.localStorage.removeItem(storageKey)
}

export async function listProjects(): Promise<Project[]> {
  const response = await supabaseHttp.get<ProjectRow[]>("/projects", {
    params: { select: "*", order: "name.asc" },
  })
  return projectsSchema.parse(response.data.map(toProject))
}

export async function createProject(project: Project): Promise<Project> {
  const response = await supabaseHttp.post<ProjectRow[]>("/projects", toProjectRow(project), {
    params: { select: "*" },
    headers: { Prefer: "return=representation" },
  })
  const row = response.data[0]
  return projectSchema.parse(toProject(row))
}

export async function upsertProjectsFromNames(names: string[]): Promise<void> {
  const normalized = [...new Set(names.map((name) => name.trim()).filter(Boolean))]
  if (normalized.length === 0) return

  const rows = normalized.map((name) => ({
    name,
  }))

  await supabaseHttp.post("/projects", rows, {
    params: { select: "id", on_conflict: "name" },
    headers: { Prefer: "resolution=merge-duplicates" },
  })
}

export async function listPunchRecords(): Promise<PunchRecord[]> {
  const response = await supabaseHttp.get<PunchRecordRow[]>("/punch_records", {
    params: { select: "*", order: "punched_at.desc" },
  })
  return punchRecordsSchema.parse(response.data.map(toPunchRecord))
}

export async function createPunchRecord(record: PunchRecord): Promise<PunchRecord> {
  const rowToWrite = toPunchRecordRow(record)
  const response = await supabaseHttp.post<PunchRecordRow[]>("/punch_records", rowToWrite, {
    params: { select: "*" },
    headers: { Prefer: "return=representation" },
  })
  const row = response.data[0]
  if (!row) return record
  const resolved: PunchRecordRow = {
    ...row,
    punched_at: row.punched_at ?? rowToWrite.punched_at,
    holiday: Boolean(row.holiday ?? rowToWrite.holiday),
    created_at: row.created_at ?? rowToWrite.created_at,
  }
  return punchRecordsSchema.element.parse(toPunchRecord(resolved))
}

export async function updatePunchRecord(
  id: string,
  updates: Partial<Omit<PunchRecord, "id">>
): Promise<PunchRecord> {
  const rowUpdates: Partial<PunchRecordWriteRow> = {}
  if (updates.type !== undefined) {
    rowUpdates.punch_type = updates.type
  }
  if (updates.timestamp !== undefined) {
    rowUpdates.punched_at = updates.timestamp
  }
  const effectiveIsHoliday =
    updates.holiday ??
    (updates.type !== undefined ? updates.type === "holiday" : undefined)
  if (effectiveIsHoliday !== undefined) {
    rowUpdates.holiday = Boolean(effectiveIsHoliday)
  }

  const response = await supabaseHttp.patch<PunchRecordRow[]>("/punch_records", rowUpdates, {
    params: { id: `eq.${id}`, select: "*" },
    headers: { Prefer: "return=representation" },
  })
  const row = response.data[0]
  if (!row) throw new Error(`PunchRecord not found after update: ${id}`)
  const resolved: PunchRecordRow = {
    ...row,
    punched_at: row.punched_at ?? rowUpdates.punched_at ?? row.created_at ?? null,
    holiday: Boolean(row.holiday ?? rowUpdates.holiday ?? false),
    created_at: row.created_at,
  }
  return punchRecordsSchema.element.parse(toPunchRecord(resolved))
}

export async function deletePunchRecord(id: string): Promise<void> {
  await supabaseHttp.delete("/punch_records", { params: { id: `eq.${id}` } })
}

export async function migrateLocalPunchRecordsToSupabase(options?: {
  storageKey?: string
}): Promise<void> {
  if (typeof window === "undefined") return
  const storageKey = options?.storageKey ?? "tiktak.punch-records.v1"
  const raw = window.localStorage.getItem(storageKey)
  if (!raw) return

  const parsed = punchRecordsSchema.safeParse(JSON.parse(raw))
  if (!parsed.success || parsed.data.length === 0) return

  const rows = parsed.data.map(toPunchRecordRow)
  await supabaseHttp.post("/punch_records", rows, {
    params: { select: "id", on_conflict: "id" },
    headers: { Prefer: "resolution=merge-duplicates" },
  })
  window.localStorage.removeItem(storageKey)
}

export async function listVacations(): Promise<Vacation[]> {
  const response = await supabaseHttp.get<VacationRow[]>("/vacation", {
    params: { select: "*", order: "init_date.desc" },
  })
  return vacationsSchema.parse(response.data.map(toVacation))
}

export async function createVacation(vacation: Vacation): Promise<Vacation> {
  const response = await supabaseHttp.post<VacationRow[]>("/vacation", toVacationRow(vacation), {
    params: { select: "*" },
    headers: { Prefer: "return=representation" },
  })
  const row = response.data[0]
  return vacationSchema.parse(toVacation(row))
}

export async function updateVacation(vacation: Vacation): Promise<Vacation> {
  const response = await supabaseHttp.patch<VacationRow[]>(
    "/vacation",
    toVacationRow(vacation),
    {
      params: { id: `eq.${vacation.id}`, select: "*" },
      headers: { Prefer: "return=representation" },
    },
  )
  const row = response.data[0]
  return vacationSchema.parse(toVacation(row))
}

export async function deleteVacation(id: string): Promise<void> {
  await supabaseHttp.delete("/vacation", { params: { id: `eq.${id}` } })
}
