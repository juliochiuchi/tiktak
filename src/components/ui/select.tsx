import * as React from "react"
import { Select } from "radix-ui"
import { Check, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

function SelectTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Select.Trigger>) {
  return (
    <Select.Trigger
      className={cn(
        "flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
      <Select.Icon asChild>
        <ChevronDown className="size-4 opacity-60" />
      </Select.Icon>
    </Select.Trigger>
  )
}

function SelectValue({
  className,
  ...props
}: React.ComponentProps<typeof Select.Value>) {
  return <Select.Value className={cn("flex-1 text-left", className)} {...props} />
}

function SelectContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Select.Content>) {
  return (
    <Select.Portal>
      <Select.Content
        className={cn(
          "z-50 overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-lg",
          className
        )}
        style={{
          ...props.style,
          width:
            "var(--radix-popper-anchor-width, var(--radix-select-trigger-width))",
          minWidth:
            "var(--radix-popper-anchor-width, var(--radix-select-trigger-width))",
        }}
        position="popper"
        sideOffset={8}
        {...props}
      >
        <Select.Viewport className="p-1">{children}</Select.Viewport>
      </Select.Content>
    </Select.Portal>
  )
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Select.Item>) {
  return (
    <Select.Item
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-xl px-3 py-2 text-sm outline-none data-[highlighted]:bg-muted data-[highlighted]:text-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <Select.ItemText>{children}</Select.ItemText>
      <Select.ItemIndicator className="absolute right-2 inline-flex items-center justify-center">
        <Check className="size-4" />
      </Select.ItemIndicator>
    </Select.Item>
  )
}

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue }
