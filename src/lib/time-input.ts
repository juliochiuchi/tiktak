export function formatTimeInput(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}:${digits.slice(2)}`
}

export function normalizeTimeInput(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 4)
  if (digits.length === 0) return ""

  const padded = digits.padEnd(4, "0")
  const hours = Number(padded.slice(0, 2))
  const minutes = Number(padded.slice(2, 4))

  const safeHours = clamp(hours, 0, 23)
  const safeMinutes = clamp(minutes, 0, 59)

  return `${String(safeHours).padStart(2, "0")}:${String(safeMinutes).padStart(
    2,
    "0"
  )}`
}

export function parseTimeInput(raw: string) {
  const match = raw.match(/^(\d{2}):(\d{2})$/)
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
  if (hours < 0 || hours > 23) return null
  if (minutes < 0 || minutes > 59) return null
  return { hours, minutes }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

