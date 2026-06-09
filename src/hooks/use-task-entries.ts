import * as React from "react"
import type { TaskEntry } from "@/lib/time-tracking"
import {
  addTaskEntry,
  editTaskEntry,
  getTaskEntriesSnapshot,
  reloadTaskEntries,
  removeTaskEntry,
  subscribeTaskEntries,
} from "@/stores/timeTrackingStore"

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
  const snapshot = React.useSyncExternalStore(
    subscribeTaskEntries,
    getTaskEntriesSnapshot,
    getTaskEntriesSnapshot
  )

  return {
    entries: snapshot.entries,
    isLoading: snapshot.isLoading,
    error: snapshot.error,
    reload: reloadTaskEntries,
    addEntry: (input: CreateTaskInput) => addTaskEntry(input),
    updateEntry: (id: string, updates: Partial<Omit<TaskEntry, "id" | "createdAt">>) =>
      editTaskEntry(id, updates),
    removeEntry: (id: string) => removeTaskEntry(id),
  }
}
