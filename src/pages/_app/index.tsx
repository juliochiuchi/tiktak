import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute("/_app/")({
  component: Index,
})

function Index() {
  return <div>Hello "/_app/index"!</div>
}
