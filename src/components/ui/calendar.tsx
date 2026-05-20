import * as React from "react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { dayjs } from "@/lib/dayjs"

type CalendarProps = {
  selected?: Date
  onSelect?: (date: Date) => void
  className?: string
}

const weekdayLabels = ["S", "M", "T", "W", "T", "F", "S"]

function Calendar({ className, selected, onSelect }: CalendarProps) {
  const [month, setMonth] = React.useState(() =>
    dayjs(selected ?? new Date()).startOf("month")
  )

  React.useEffect(() => {
    if (!selected) return
    setMonth(dayjs(selected).startOf("month"))
  }, [selected])

  const start = month.startOf("month")
  const end = month.endOf("month")
  const startWeekDay = start.day()
  const daysInMonth = end.date()

  const days: Array<dayjs.Dayjs | null> = []
  for (let index = 0; index < startWeekDay; index += 1) days.push(null)
  for (let day = 1; day <= daysInMonth; day += 1) days.push(start.date(day))

  const rows: Array<Array<dayjs.Dayjs | null>> = []
  for (let index = 0; index < days.length; index += 7) {
    rows.push(days.slice(index, index + 7))
  }

  const selectedKey = selected ? dayjs(selected).format("YYYY-MM-DD") : null
  const todayKey = dayjs().format("YYYY-MM-DD")

  return (
    <div className={cn("w-[18.5rem] p-2", className)}>
      <div className="flex items-center justify-between px-1 pb-3">
        <button
          type="button"
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon-sm" }),
            "rounded-xl"
          )}
          onClick={() => setMonth((previous) => previous.subtract(1, "month"))}
          aria-label="Previous month"
        >
          {"←"}
        </button>
        <div className="text-sm font-medium">{month.format("MMMM YYYY")}</div>
        <button
          type="button"
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon-sm" }),
            "rounded-xl"
          )}
          onClick={() => setMonth((previous) => previous.add(1, "month"))}
          aria-label="Next month"
        >
          {"→"}
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 px-1 text-center text-[0.75rem] font-medium text-muted-foreground">
        {weekdayLabels.map((label) => (
          <div key={label} className="grid h-7 place-items-center">
            {label}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1 px-1">
        {rows.flatMap((row, rowIndex) =>
          row.map((cell, cellIndex) => {
            const key = `${rowIndex}-${cellIndex}`
            if (!cell) return <div key={key} className="h-9 w-9" />

            const dateKey = cell.format("YYYY-MM-DD")
            const isSelected = selectedKey === dateKey
            const isToday = todayKey === dateKey

            return (
              <button
                key={key}
                type="button"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon-sm" }),
                  "h-9 w-9 rounded-xl font-normal",
                  isToday && !isSelected && "bg-muted text-foreground",
                  isSelected && "bg-primary text-primary-foreground hover:bg-primary"
                )}
                onClick={() => onSelect?.(cell.toDate())}
              >
                {cell.date()}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

export { Calendar }
