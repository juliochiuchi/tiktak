import * as React from "react"

import { ToastContext } from "@/lib/toast"

export function useToast() {
  const value = React.useContext(ToastContext)
  if (!value) {
    throw new Error("useToast must be used within ToastProvider")
  }
  return value
}
