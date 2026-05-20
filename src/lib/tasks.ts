import { sum } from "@/lib/time"
import { type TaskEntry } from "@/lib/time-tracking"

export function getTotalTaskMinutes(entries: TaskEntry[]) {
  return sum(entries.map((entry) => entry.durationMinutes))
}

export function getActiveProjectsCount(entries: TaskEntry[]) {
  return new Set(entries.map((entry) => entry.project.trim()).filter(Boolean)).size
}

export function groupTasksByDate(entries: TaskEntry[]) {
  const groups = new Map<string, TaskEntry[]>()
  for (const entry of entries) {
    const current = groups.get(entry.date) ?? []
    current.push(entry)
    groups.set(entry.date, current)
  }

  return Array.from(groups.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([date, dateEntries]) => ({
      date,
      entries: dateEntries.sort((a, b) =>
        a.createdAt < b.createdAt ? 1 : -1
      ),
    }))
}

export function getMinutesForDate(entries: TaskEntry[], date: string) {
  return sum(entries.filter((entry) => entry.date === date).map((entry) => entry.durationMinutes))
}

