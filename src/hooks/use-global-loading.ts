import * as React from "react"

import { getLoadingSnapshot, subscribeLoading } from "@/stores/loadingStore"

export function useGlobalLoading() {
  return React.useSyncExternalStore(subscribeLoading, getLoadingSnapshot, getLoadingSnapshot)
}
