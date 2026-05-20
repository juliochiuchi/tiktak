import * as React from "react"

import { Input } from "@/components/ui/input"
import { formatTimeInput, normalizeTimeInput } from "@/lib/time-input"
import { cn } from "@/lib/utils"

type Props = Omit<React.ComponentProps<typeof Input>, "value" | "onChange"> & {
  value: string
  onChange: (value: string) => void
}

export function TimeInput({ value, onChange, className, ...props }: Props) {
  return (
    <Input
      inputMode="numeric"
      maxLength={5}
      value={value}
      onChange={(event) => onChange(formatTimeInput(event.currentTarget.value))}
      onBlur={() => onChange(normalizeTimeInput(value))}
      className={cn("tabular-nums", className)}
      {...props}
    />
  )
}

