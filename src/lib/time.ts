import { dayjs } from "@/lib/dayjs"

export function getDayKey(date: Date) {
  return dayjs(date).format("YYYY-MM-DD")
}

export function parseDayKey(value: string) {
  const parsed = dayjs(value, "YYYY-MM-DD", true)
  if (!parsed.isValid()) return null
  return parsed.toDate()
}

export function getDayKeysInRange(start: Date, end: Date) {
  const startDate = dayjs(start).startOf("day")
  const endDate = dayjs(end).startOf("day")
  if (startDate.isAfter(endDate)) return []

  const keys: string[] = []
  let cursor = startDate

  while (!cursor.isAfter(endDate, "day")) {
    keys.push(cursor.format("YYYY-MM-DD"))
    cursor = cursor.add(1, "day")
  }

  return keys
}

export function formatClockTime(date: Date) {
  return dayjs(date).format("HH:mm")
}

export function formatSeconds(date: Date) {
  return dayjs(date).format("ss")
}

export function formatDateLong(date: Date) {
  return dayjs(date).format("DD/MM/YYYY")
}

export function formatDateWithWeekday(date: Date) {
  return titleCase(dayjs(date).format("dddd, DD/MM/YYYY"))
}

export function formatDateSection(date: Date) {
  return dayjs(date).format("DD/MM/YYYY")
}

export function formatDateShort(date: Date) {
  return dayjs(date).format("DD/MM")
}

export function formatDurationMinutes(totalMinutes: number) {
  const safeMinutes = Math.max(0, Math.round(totalMinutes))
  const hours = Math.floor(safeMinutes / 60)
  const minutes = safeMinutes % 60

  if (hours <= 0) return `${minutes}min`
  if (minutes <= 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}

export function sum(numbers: Array<number>) {
  return numbers.reduce((accumulator, current) => accumulator + current, 0)
}

export function titleCase(text: string) {
  return text.replace(/\S+/g, (word) => {
    const head = word.charAt(0).toLocaleUpperCase()
    const tail = word.slice(1)
    return `${head}${tail}`
  })
}
