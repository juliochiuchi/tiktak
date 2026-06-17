import * as React from "react"
import { Dialog } from "radix-ui"

import { cn } from "@/lib/utils"

function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof Dialog.Overlay>) {
  return (
    <Dialog.Overlay
      className={cn(
        "fixed inset-0 z-50 bg-background/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  )
}

function DrawerContent({
  className,
  side = "left",
  ...props
}: React.ComponentProps<typeof Dialog.Content> & {
  side?: "left" | "right"
}) {
  return (
    <Dialog.Portal>
      <DrawerOverlay />
      <Dialog.Content
        className={cn(
          "fixed inset-y-0 z-50 w-[min(22rem,85vw)] overflow-y-auto border bg-card shadow-lg outline-none",
          side === "left" &&
            "left-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
          side === "right" &&
            "right-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
          className
        )}
        {...props}
      />
    </Dialog.Portal>
  )
}

export { Dialog as Drawer, DrawerContent, DrawerOverlay }
