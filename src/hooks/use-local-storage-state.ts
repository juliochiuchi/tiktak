import * as React from "react"
import { type ZodType } from "zod"

type Options<T> = {
  key: string
  defaultValue: T
  schema?: ZodType<T>
}

export function useLocalStorageState<T>({
  key,
  defaultValue,
  schema,
}: Options<T>) {
  const [value, setValue] = React.useState<T>(() => {
    if (typeof window === "undefined") return defaultValue
    const raw = window.localStorage.getItem(key)
    if (!raw) return defaultValue

    try {
      const parsed = JSON.parse(raw)
      if (schema) {
        const result = schema.safeParse(parsed)
        if (result.success) return result.data
        return defaultValue
      }
      return parsed as T
    } catch {
      return defaultValue
    }
  })

  React.useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      return
    }
  }, [key, value])

  return [value, setValue] as const
}
