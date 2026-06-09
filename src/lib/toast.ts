import * as React from "react"

export type ToastVariant = "default" | "success" | "error"

export type ToastOptions = {
  title: string
  description?: string
  variant?: ToastVariant
  durationMs?: number
}

export type ToastApi = {
  toast: (options: ToastOptions) => string
  dismiss: (id: string) => void
  dismissAll: () => void
}

export const ToastContext = React.createContext<ToastApi | null>(null)
