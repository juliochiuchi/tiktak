import { useLocalStorageState } from "@/hooks/use-local-storage-state"
import {
  type PunchRecord,
  type PunchType,
  createId,
  punchRecordsSchema,
} from "@/lib/time-tracking"

const storageKey = "tiktak.punch-records.v1"

export function usePunchRecords() {
  const [records, setRecords] = useLocalStorageState<PunchRecord[]>({
    key: storageKey,
    defaultValue: [],
    schema: punchRecordsSchema,
  })

  function addRecord(type: PunchType, timestamp: Date = new Date()) {
    const record: PunchRecord = {
      id: createId(),
      type,
      timestamp: timestamp.toISOString(),
    }

    setRecords((previous) => [record, ...previous])
    return record
  }

  function updateRecord(id: string, updates: Partial<Omit<PunchRecord, "id">>) {
    setRecords((previous) =>
      previous.map((record) => (record.id === id ? { ...record, ...updates } : record))
    )
  }

  function removeRecord(id: string) {
    setRecords((previous) => previous.filter((record) => record.id !== id))
  }

  return { records, setRecords, addRecord, updateRecord, removeRecord }
}
