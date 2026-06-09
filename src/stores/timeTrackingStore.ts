import {
  type Project,
  type PunchRecord,
  type PunchType,
  type TaskEntry,
  createId,
} from "@/lib/time-tracking"
import {
  createProject,
  createPunchRecord,
  createTaskEntry,
  deletePunchRecord,
  deleteTaskEntry,
  listProjects,
  listPunchRecords,
  listTaskEntries,
  migrateLocalPunchRecordsToSupabase,
  migrateLocalTaskEntriesToSupabase,
  upsertProjectsFromNames,
  updatePunchRecord,
  updateTaskEntry,
} from "@/services/timeTrackingApi"

type TaskEntriesState = {
  entries: TaskEntry[]
  isLoading: boolean
  error: unknown
}

type PunchRecordsState = {
  records: PunchRecord[]
  isLoading: boolean
  error: unknown
}

type ProjectsState = {
  projects: Project[]
  isLoading: boolean
  error: unknown
}

let taskEntriesState: TaskEntriesState = { entries: [], isLoading: true, error: null }
let punchRecordsState: PunchRecordsState = { records: [], isLoading: true, error: null }
let projectsState: ProjectsState = { projects: [], isLoading: true, error: null }

const taskEntriesListeners = new Set<() => void>()
const punchRecordsListeners = new Set<() => void>()
const projectsListeners = new Set<() => void>()

function notifyTaskEntries() {
  for (const listener of taskEntriesListeners) listener()
}

function notifyPunchRecords() {
  for (const listener of punchRecordsListeners) listener()
}

function notifyProjects() {
  for (const listener of projectsListeners) listener()
}

export function subscribeTaskEntries(listener: () => void) {
  taskEntriesListeners.add(listener)
  return () => taskEntriesListeners.delete(listener)
}

export function getTaskEntriesSnapshot() {
  return taskEntriesState
}

export function subscribePunchRecords(listener: () => void) {
  punchRecordsListeners.add(listener)
  return () => punchRecordsListeners.delete(listener)
}

export function getPunchRecordsSnapshot() {
  return punchRecordsState
}

export function subscribeProjects(listener: () => void) {
  projectsListeners.add(listener)
  return () => projectsListeners.delete(listener)
}

export function getProjectsSnapshot() {
  return projectsState
}

export async function reloadTaskEntries(): Promise<void> {
  taskEntriesState = { ...taskEntriesState, isLoading: true, error: null }
  notifyTaskEntries()

  try {
    await migrateLocalTaskEntriesToSupabase()
    const entries = await listTaskEntries()
    taskEntriesState = { entries, isLoading: false, error: null }
  } catch (error) {
    taskEntriesState = { ...taskEntriesState, isLoading: false, error }
  }
  notifyTaskEntries()
}

export async function reloadProjects(): Promise<void> {
  projectsState = { ...projectsState, isLoading: true, error: null }
  notifyProjects()

  try {
    await migrateLocalTaskEntriesToSupabase()
    const projects = await listProjects()
    projectsState = { projects, isLoading: false, error: null }
  } catch (error) {
    projectsState = { ...projectsState, isLoading: false, error }
  }
  notifyProjects()
}

export async function reloadPunchRecords(): Promise<void> {
  punchRecordsState = { ...punchRecordsState, isLoading: true, error: null }
  notifyPunchRecords()

  try {
    await migrateLocalPunchRecordsToSupabase()
    const records = await listPunchRecords()
    punchRecordsState = { records, isLoading: false, error: null }
  } catch (error) {
    punchRecordsState = { ...punchRecordsState, isLoading: false, error }
  }
  notifyPunchRecords()
}

export async function addTaskEntry(input: Omit<TaskEntry, "id" | "createdAt">): Promise<TaskEntry> {
  const now = new Date()
  const entry: TaskEntry = {
    id: createId(),
    createdAt: now.toISOString(),
    ...input,
  }

  await upsertProjectsFromNames([entry.project])
  const saved = await createTaskEntry(entry)
  taskEntriesState = {
    ...taskEntriesState,
    entries: [saved, ...taskEntriesState.entries.filter((e) => e.id !== saved.id)],
  }
  notifyTaskEntries()
  await reloadProjects()
  return saved
}

export async function editTaskEntry(
  id: string,
  updates: Partial<Omit<TaskEntry, "id" | "createdAt">>
): Promise<TaskEntry> {
  if (updates.project) {
    await upsertProjectsFromNames([updates.project])
  }
  const saved = await updateTaskEntry(id, updates)
  taskEntriesState = {
    ...taskEntriesState,
    entries: taskEntriesState.entries.map((e) => (e.id === id ? saved : e)),
  }
  notifyTaskEntries()
  if (updates.project) {
    await reloadProjects()
  }
  return saved
}

export async function removeTaskEntry(id: string): Promise<void> {
  await deleteTaskEntry(id)
  taskEntriesState = {
    ...taskEntriesState,
    entries: taskEntriesState.entries.filter((e) => e.id !== id),
  }
  notifyTaskEntries()
}

export async function addPunchRecord(type: PunchType, timestamp: Date = new Date()): Promise<PunchRecord> {
  const record: PunchRecord = {
    id: createId(),
    type,
    timestamp: timestamp.toISOString(),
  }

  const saved = await createPunchRecord(record)
  punchRecordsState = {
    ...punchRecordsState,
    records: [saved, ...punchRecordsState.records.filter((r) => r.id !== saved.id)],
  }
  notifyPunchRecords()
  return saved
}

export async function editPunchRecord(
  id: string,
  updates: Partial<Omit<PunchRecord, "id">>
): Promise<PunchRecord> {
  const saved = await updatePunchRecord(id, updates)
  punchRecordsState = {
    ...punchRecordsState,
    records: punchRecordsState.records.map((r) => (r.id === id ? saved : r)),
  }
  notifyPunchRecords()
  return saved
}

export async function removePunchRecord(id: string): Promise<void> {
  await deletePunchRecord(id)
  punchRecordsState = {
    ...punchRecordsState,
    records: punchRecordsState.records.filter((r) => r.id !== id),
  }
  notifyPunchRecords()
}

export async function addProjectByName(name: string): Promise<Project> {
  const normalizedName = name.trim()
  if (!normalizedName) {
    throw new Error("Project name is required")
  }

  const existing = projectsState.projects.find(
    (project) => project.name.toLocaleLowerCase() === normalizedName.toLocaleLowerCase()
  )
  if (existing) return existing

  const project: Project = {
    id: createId(),
    name: normalizedName,
    createdAt: new Date().toISOString(),
  }

  try {
    const saved = await createProject(project)
    projectsState = {
      ...projectsState,
      projects: [...projectsState.projects, saved].sort((a, b) => a.name.localeCompare(b.name)),
    }
    notifyProjects()
    return saved
  } catch {
    await upsertProjectsFromNames([normalizedName])
    await reloadProjects()
    const loaded = projectsState.projects.find(
      (item) => item.name.toLocaleLowerCase() === normalizedName.toLocaleLowerCase()
    )
    if (!loaded) {
      throw new Error("Project could not be loaded")
    }
    return loaded
  }
}

if (typeof window !== "undefined") {
  void reloadTaskEntries()
  void reloadPunchRecords()
  void reloadProjects()
}
