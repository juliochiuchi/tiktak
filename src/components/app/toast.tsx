import * as React from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  ToastContext,
  type ToastApi,
  type ToastOptions,
  type ToastVariant,
} from "@/lib/toast.ts"
import { cn } from "@/lib/utils"

type ToastItem = ToastOptions & {
  id: string
  createdAt: number
}

function createToastId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return String(Date.now()) + String(Math.random()).slice(2)
}

function getVariantClasses(variant: ToastVariant) {
  if (variant === "success") {
    return "border-emerald-500/25 bg-emerald-500/10 text-foreground"
  }
  if (variant === "error") {
    return "border-destructive/25 bg-destructive/10 text-foreground"
  }
  return "border-border/60 bg-background/90 text-foreground"
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([])
  const timersRef = React.useRef(new Map<string, number>())

  const dismiss = React.useCallback((id: string) => {
    const timer = timersRef.current.get(id)
    if (timer) {
      window.clearTimeout(timer)
      timersRef.current.delete(id)
    }
    setItems((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const dismissAll = React.useCallback(() => {
    for (const timer of timersRef.current.values()) {
      window.clearTimeout(timer)
    }
    timersRef.current.clear()
    setItems([])
  }, [])

  const toast = React.useCallback(
    (options: ToastOptions) => {
      const id = createToastId()
      const variant = options.variant ?? "default"
      const durationMs = options.durationMs ?? 3500
      const item: ToastItem = {
        id,
        createdAt: Date.now(),
        ...options,
        variant,
        durationMs,
      }

      setItems((current) => [item, ...current].slice(0, 5))

      if (typeof window !== "undefined") {
        const timer = window.setTimeout(() => dismiss(id), durationMs)
        timersRef.current.set(id, timer)
      }

      return id
    },
    [dismiss]
  )

  React.useEffect(() => {
    return () => {
      for (const timer of timersRef.current.values()) {
        window.clearTimeout(timer)
      }
      timersRef.current.clear()
    }
  }, [])

  const value = React.useMemo<ToastApi>(
    () => ({ toast, dismiss, dismissAll }),
    [dismiss, dismissAll, toast]
  )

  const content = (
    <div
      className="pointer-events-none fixed left-1/2 top-4 z-[60] w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 space-y-2"
      aria-live="polite"
      aria-relevant="additions removals"
    >
      {items.map((item) => (
        <div
          key={item.id}
          role="status"
          className={cn(
            "pointer-events-auto grid gap-1 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-xl",
            "animate-in fade-in slide-in-from-top-2 duration-200",
            getVariantClasses(item.variant ?? "default")
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{item.title}</div>
              {item.description ? (
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {item.description}
                </div>
              ) : null}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground"
              aria-label="Fechar notificação"
              onClick={() => dismiss(item.id)}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      {typeof document !== "undefined" ? createPortal(content, document.body) : null}
    </ToastContext.Provider>
  )
}
