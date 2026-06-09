import * as React from "react"
import {
  addProjectByName,
  getProjectsSnapshot,
  reloadProjects,
  subscribeProjects,
} from "@/stores/timeTrackingStore"

export function useProjects() {
  const snapshot = React.useSyncExternalStore(
    subscribeProjects,
    getProjectsSnapshot,
    getProjectsSnapshot
  )

  return {
    projects: snapshot.projects,
    isLoading: snapshot.isLoading,
    error: snapshot.error,
    reload: reloadProjects,
    addProject: (name: string) => addProjectByName(name),
  }
}
