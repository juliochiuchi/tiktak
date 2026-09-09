import { dayjs } from "@/lib/dayjs"
import { getDayKeysInRange } from "@/lib/time"
import type { Vacation } from "@/lib/time-tracking"

function normalizeDayKey(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  return dayjs(value).format("YYYY-MM-DD")
}

export function isDayInVacation(
  vacations: Vacation[],
  dayKey: string
): boolean {
  const normalizedDayKey = normalizeDayKey(dayKey)
  return vacations.some((vacation) => {
    const start = normalizeDayKey(vacation.initDate)
    const end = normalizeDayKey(vacation.endDate)
    return normalizedDayKey >= start && normalizedDayKey <= end
  })
}

export function getDaysInVacationRange(
  vacations: Vacation[],
  rangeStart: Date,
  rangeEnd: Date
): Set<string> {
  const result = new Set<string>()
  const rangeDayKeys = getDayKeysInRange(rangeStart, rangeEnd)

  for (const vacation of vacations) {
    const vacationStart = dayjs(vacation.initDate).startOf("day").toDate()
    const vacationEnd = dayjs(vacation.endDate).startOf("day").toDate()
    const vacationDayKeys = getDayKeysInRange(vacationStart, vacationEnd)

    for (const dayKey of vacationDayKeys) {
      if (rangeDayKeys.includes(dayKey)) {
        result.add(dayKey)
      }
    }
  }

  return result
}

export function getVacationForDay(
  vacations: Vacation[],
  dayKey: string
): Vacation | null {
  const normalizedDayKey = normalizeDayKey(dayKey)
  for (const vacation of vacations) {
    const start = normalizeDayKey(vacation.initDate)
    const end = normalizeDayKey(vacation.endDate)
    if (normalizedDayKey >= start && normalizedDayKey <= end) {
      return vacation
    }
  }
  return null
}

export function hasVacationOverlap(
  vacations: Vacation[],
  initDate: string,
  endDate: string,
  excludeId?: string
): boolean {
  const s1 = normalizeDayKey(initDate)
  const e1 = normalizeDayKey(endDate)

  return vacations.some((vacation) => {
    if (excludeId !== undefined && vacation.id === excludeId) return false
    const s2 = normalizeDayKey(vacation.initDate)
    const e2 = normalizeDayKey(vacation.endDate)
    return s1 <= e2 && e1 >= s2
  })
}
