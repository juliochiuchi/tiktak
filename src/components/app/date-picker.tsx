import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { dayjs } from "@/lib/dayjs"

type Props = {
  value?: Date
  onChange: (date?: Date) => void
  className?: string
}

export function DatePicker({
  value,
  onChange,
  className,
}: Props) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-10 w-full justify-start gap-2 rounded-xl px-3 font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="size-4 opacity-70" />
          {value ? dayjs(value).format("DD/MM/YYYY") : "Select a date"}
        </Button>
      </Popover.Trigger>
      <PopoverContent align="start" className="p-0">
        <Calendar
          key={value ? dayjs(value).format("YYYY-MM") : "empty"}
          selected={value}
          onSelect={(next) => {
            onChange(next)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover.Root>
  )
}
