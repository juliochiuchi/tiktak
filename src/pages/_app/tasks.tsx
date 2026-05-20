import { createFileRoute } from "@tanstack/react-router"
import { TasksPage } from "@/components/app/tasks-page"

export const Route = createFileRoute("/_app/tasks")({
  component: TasksPage,
})
