import * as React from "react"

export type Theme = "light" | "dark"

const storageKey = "tiktak.theme"

function getPreferredTheme(): Theme {
  if (typeof window === "undefined") return "light"

  const stored = window.localStorage.getItem(storageKey)
  if (stored === "light" || stored === "dark") return stored

  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches
  return prefersDark ? "dark" : "light"
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.toggle("dark", theme === "dark")
}

export function useTheme() {
  const [theme, setTheme] = React.useState<Theme>(() => getPreferredTheme())

  React.useEffect(() => {
    applyTheme(theme)
    window.localStorage.setItem(storageKey, theme)
  }, [theme])

  return {
    theme,
    setTheme,
    toggleTheme: () => setTheme((previous) => (previous === "dark" ? "light" : "dark")),
  }
}

