import { dayjs } from "@/lib/dayjs"
import { getDayKey } from "@/lib/time"
import { type PunchRecord } from "@/lib/time-tracking"

function toMinute(date: Date) {
  return dayjs(date).startOf("minute")
}

export function getRecordsForDay(records: PunchRecord[], dayKey: string) {
  return records
    .filter((record) => getDayKey(new Date(record.timestamp)) === dayKey)
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
}

export function getWorkedMinutesForDay(
  records: PunchRecord[],
  dayKey: string,
  now: Date = new Date()
) {
  const dayRecords = getRecordsForDay(records, dayKey).filter(
    (r) => r.type !== "holiday" && !r.holiday
  )
  let currentStart: Date | null = null
  let totalMinutes = 0

  for (const record of dayRecords) {
    const at = new Date(record.timestamp)
    if (record.type === "in") {
      currentStart = at
      continue
    }

    if (record.type === "out" && currentStart) {
      totalMinutes += toMinute(at).diff(toMinute(currentStart).toDate(), "minute")
      currentStart = null
    }
  }

  if (currentStart) {
    totalMinutes += toMinute(now).diff(toMinute(currentStart).toDate(), "minute")
  }

  return Math.max(0, totalMinutes)
}

export function getWorkedMinutesForDayClosed(records: PunchRecord[], dayKey: string) {
  const dayRecords = getRecordsForDay(records, dayKey).filter(
    (r) => r.type !== "holiday" && !r.holiday
  )
  let currentStart: Date | null = null
  let totalMinutes = 0

  for (const record of dayRecords) {
    const at = new Date(record.timestamp)
    if (record.type === "in") {
      currentStart = at
      continue
    }

    if (record.type === "out" && currentStart) {
      totalMinutes += toMinute(at).diff(toMinute(currentStart).toDate(), "minute")
      currentStart = null
    }
  }

  return Math.max(0, totalMinutes)
}

export type PunchRecordsGroup = {
  date: string
  records: PunchRecord[]
}

export function groupPunchRecordsByDate(records: PunchRecord[]): PunchRecordsGroup[] {
  const groups = new Map<string, PunchRecord[]>()

  for (const record of records) {
    const dayKey = getDayKey(new Date(record.timestamp))
    const existing = groups.get(dayKey)
    if (existing) {
      existing.push(record)
    } else {
      groups.set(dayKey, [record])
    }
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => (a > b ? -1 : 1))
    .map(([date, dayRecords]) => ({
      date,
      records: dayRecords.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ),
    }))
}

export function isHolidayDay(records: PunchRecord[], dayKey: string) {
  const dayRecords = getRecordsForDay(records, dayKey)
  if (dayRecords.some((r) => r.type === "holiday" || r.holiday)) return true
  if (dayRecords.length !== 2) return false
  const [first, second] = dayRecords
  if (!first || !second) return false
  if (first.type !== "in" || second.type !== "out") return false
  const totalMinutes = getWorkedMinutesForDayClosed(records, dayKey)
  return totalMinutes === 8 * 60
}

export function hasHolidayRecordForDay(
  records: PunchRecord[],
  dayKey: string,
  excludeId?: string
): boolean {
  const dayRecords = getRecordsForDay(records, dayKey)
  return dayRecords.some(
    (r) =>
      (r.type === "holiday" || r.holiday) &&
      (excludeId === undefined || r.id !== excludeId)
  )
}
