import {
  projectSchema,
  projectsSchema,
  punchRecordsSchema,
  taskEntriesSchema,
  type Project,
  type PunchRecord,
  type TaskEntry,
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
  punch_type: "in" | "out"
  punched_at: string
}

type ProjectRow = {
  id: string
  name: string
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
  return {
    id: row.id,
    type: row.punch_type,
    timestamp: row.punched_at,
  }
}

function toPunchRecordRow(record: PunchRecord): PunchRecordRow {
  return {
    id: record.id,
    punch_type: record.type,
    punched_at: record.timestamp,
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
  const response = await supabaseHttp.post<PunchRecordRow[]>("/punch_records", toPunchRecordRow(record), {
    params: { select: "*" },
    headers: { Prefer: "return=representation" },
  })
  const row = response.data[0]
  return punchRecordsSchema.element.parse(toPunchRecord(row))
}

export async function updatePunchRecord(
  id: string,
  updates: Partial<Omit<PunchRecord, "id">>
): Promise<PunchRecord> {
  const rowUpdates: Partial<PunchRecordRow> = {}
  if (updates.type !== undefined) rowUpdates.punch_type = updates.type
  if (updates.timestamp !== undefined) rowUpdates.punched_at = updates.timestamp

  const response = await supabaseHttp.patch<PunchRecordRow[]>("/punch_records", rowUpdates, {
    params: { id: `eq.${id}`, select: "*" },
    headers: { Prefer: "return=representation" },
  })
  const row = response.data[0]
  return punchRecordsSchema.element.parse(toPunchRecord(row))
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
