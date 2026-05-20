import { useLocalStorageState } from "@/hooks/use-local-storage-state"
import { createId, taskEntriesSchema, type TaskEntry } from "@/lib/time-tracking"

const storageKey = "tiktak.task-entries.v3"

type CreateTaskInput = {
  description: string
  project: string
  date: string
  occurredAt: string
  durationMinutes: number
  logged: boolean
  jiraIssueKey: string
  branchName: string
}

export function useTaskEntries() {
  const [entries, setEntries] = useLocalStorageState<TaskEntry[]>({
    key: storageKey,
    defaultValue: [],
    schema: taskEntriesSchema,
  })

  function addEntry(input: CreateTaskInput) {
    const now = new Date()
    const entry: TaskEntry = {
      id: createId(),
      createdAt: now.toISOString(),
      ...input,
    }

    setEntries((previous) => [entry, ...previous])
    return entry
  }

  function removeEntry(id: string) {
    setEntries((previous) => previous.filter((entry) => entry.id !== id))
  }

  function updateEntry(id: string, updates: Partial<Omit<TaskEntry, "id" | "createdAt">>) {
    setEntries((previous) =>
      previous.map((entry) => (entry.id === id ? { ...entry, ...updates } : entry))
    )
  }

  return { entries, setEntries, addEntry, removeEntry, updateEntry }
}
