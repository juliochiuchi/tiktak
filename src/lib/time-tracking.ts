import { z } from "zod"

export type PunchType = "in" | "out" | "holiday"

export type PunchRecord = {
  id: string
  type: PunchType
  timestamp: string
  holiday: boolean
}

export type TaskEntry = {
  id: string
  description: string
  project: string
  date: string
  occurredAt: string
  durationMinutes: number
  logged: boolean
  jiraIssueKey: string
  branchName: string
  createdAt: string
}

export type Project = {
  id: string
  name: string
  createdAt: string
}

export type Vacation = {
  id: string
  initDate: string
  endDate: string
  createdAt: string
}

export const vacationSchema = z.object({
  id: z.string(),
  initDate: z.string(),
  endDate: z.string(),
  createdAt: z.string(),
})

export const vacationsSchema = z.array(vacationSchema)

export const punchRecordSchema = z.object({
  id: z.string(),
  type: z.enum(["in", "out", "holiday"]),
  timestamp: z.string(),
  holiday: z.boolean().nullish().default(false).transform((v) => Boolean(v)),
})

export const punchRecordsSchema = z.array(punchRecordSchema)

export const taskEntrySchema = z.object({
  id: z.string(),
  description: z.string(),
  project: z.string(),
  date: z.string(),
  occurredAt: z.string(),
  durationMinutes: z.number(),
  logged: z.boolean().default(false),
  jiraIssueKey: z.string().default(""),
  branchName: z.string().default(""),
  createdAt: z.string(),
})

export const taskEntriesSchema = z.array(taskEntrySchema)

export const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
})

export const projectsSchema = z.array(projectSchema)

export function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return String(Date.now()) + String(Math.random()).slice(2)
}
