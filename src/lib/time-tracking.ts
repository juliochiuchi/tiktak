import { z } from "zod"

export type PunchType = "in" | "out"

export type PunchRecord = {
  id: string
  type: PunchType
  timestamp: string
}

export type TaskEntry = {
  id: string
  description: string
  project: string
  date: string
  occurredAt: string
  durationMinutes: number
  createdAt: string
}

export const punchRecordSchema = z.object({
  id: z.string(),
  type: z.enum(["in", "out"]),
  timestamp: z.string(),
})

export const punchRecordsSchema = z.array(punchRecordSchema)

export const taskEntrySchema = z.object({
  id: z.string(),
  description: z.string(),
  project: z.string(),
  date: z.string(),
  occurredAt: z.string(),
  durationMinutes: z.number(),
  createdAt: z.string(),
})

export const taskEntriesSchema = z.array(taskEntrySchema)

export function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return String(Date.now()) + String(Math.random()).slice(2)
}
