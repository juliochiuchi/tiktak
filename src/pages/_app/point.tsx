import { createFileRoute } from "@tanstack/react-router"
import { PointPage } from "@/components/app/point-page"

export const Route = createFileRoute("/_app/point")({
  component: PointPage,
})
