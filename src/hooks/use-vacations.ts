import * as React from "react"
import type { Vacation } from "@/lib/time-tracking"
import {
  addVacation,
  getVacationsSnapshot,
  reloadVacations,
  removeVacation,
  subscribeVacations,
  updateVacationById,
} from "@/stores/timeTrackingStore"

type CreateVacationInput = {
  initDate: string
  endDate: string
}

type UpdateVacationInput = {
  id: string
  initDate: string
  endDate: string
}

export function useVacations() {
  const snapshot = React.useSyncExternalStore(
    subscribeVacations,
    getVacationsSnapshot,
    getVacationsSnapshot
  )

  return {
    vacations: snapshot.vacations,
    isLoading: snapshot.isLoading,
    error: snapshot.error,
    reload: reloadVacations,
    addVacation: (input: CreateVacationInput) => addVacation(input),
    updateVacation: (input: UpdateVacationInput) => updateVacationById(input),
    removeVacation: (id: string) => removeVacation(id),
  }
}
