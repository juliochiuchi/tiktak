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
