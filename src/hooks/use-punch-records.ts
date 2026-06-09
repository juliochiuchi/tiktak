import * as React from "react"
import type { PunchRecord, PunchType } from "@/lib/time-tracking"
import {
  addPunchRecord,
  editPunchRecord,
  getPunchRecordsSnapshot,
  reloadPunchRecords,
  removePunchRecord,
  subscribePunchRecords,
} from "@/stores/timeTrackingStore"

export function usePunchRecords() {
  const snapshot = React.useSyncExternalStore(
    subscribePunchRecords,
    getPunchRecordsSnapshot,
    getPunchRecordsSnapshot
  )

  return {
    records: snapshot.records,
    isLoading: snapshot.isLoading,
    error: snapshot.error,
    reload: reloadPunchRecords,
    addRecord: (type: PunchType, timestamp?: Date) => addPunchRecord(type, timestamp),
    updateRecord: (id: string, updates: Partial<Omit<PunchRecord, "id">>) =>
      editPunchRecord(id, updates),
    removeRecord: (id: string) => removePunchRecord(id),
  }
}
