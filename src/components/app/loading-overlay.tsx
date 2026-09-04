import * as React from "react"

import { useGlobalLoading } from "@/hooks/use-global-loading"
import { cn } from "@/lib/utils"

export function LoadingOverlay(props: { label?: string; delayMs?: number }) {
  const { isLoading } = useGlobalLoading()
  const delayMs = props.delayMs ?? 180
  const label = props.label ?? "Carregando…"

  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    let showTimer: number | undefined
    let hideTimer: number | undefined

    if (isLoading) {
      showTimer = window.setTimeout(() => setVisible(true), delayMs)
    } else {
      hideTimer = window.setTimeout(() => setVisible(false), 0)
    }

    return () => {
      if (showTimer) window.clearTimeout(showTimer)
      if (hideTimer) window.clearTimeout(hideTimer)
    }
  }, [delayMs, isLoading])

  return (
    <div
      aria-busy={isLoading}
      aria-live="polite"
      className={cn(
        "fixed inset-0 z-[60] flex items-center justify-center bg-background/60 backdrop-blur-sm transition-opacity duration-200",
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      )}
    >
      <div className="flex items-center gap-3 rounded-2xl border bg-card/80 px-4 py-3 shadow-lg backdrop-blur">
        <Spinner className="text-foreground/80" />
        <div className="text-sm font-medium text-foreground/90">{label}</div>
      </div>
    </div>
  )
}

function Spinner(props: { className?: string }) {
  return (
    <svg
      className={cn("size-5 animate-spin", props.className)}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="status"
      aria-label="Carregando"
    >
      <path
        d="M12 2a10 10 0 1 0 10 10"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
