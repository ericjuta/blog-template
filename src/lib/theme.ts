import { useEffect, useState } from "react"

export type ThemePreference = "system" | "light" | "dark"
export const THEME_STORAGE_KEY = "rea-theme"

function parseTheme(value: string | null): ThemePreference {
  return value === "light" || value === "dark" ? value : "system"
}

export function readStoredTheme(): ThemePreference {
  try {
    return parseTheme(window.localStorage.getItem(THEME_STORAGE_KEY))
  } catch {
    return "system"
  }
}

export function applyTheme(pref: ThemePreference): void {
  if (typeof document === "undefined") {
    return
  }
  const { dataset } = document.documentElement
  if (pref === "system") {
    delete dataset.theme
  } else {
    dataset.theme = pref
  }
}

export function cycleTheme(pref: ThemePreference): ThemePreference {
  return pref === "system" ? "light" : pref === "light" ? "dark" : "system"
}

export function useTheme() {
  const [theme, setPreference] = useState(readStoredTheme)

  useEffect(() => applyTheme(theme), [theme])

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== THEME_STORAGE_KEY && event.key !== null) {
        return
      }
      try {
        if (event.storageArea && event.storageArea !== window.localStorage) {
          return
        }
      } catch {
        return
      }
      setPreference(parseTheme(event.newValue))
    }

    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  function setTheme(pref: ThemePreference): void {
    setPreference(pref)
    try {
      if (pref === "system") {
        window.localStorage.removeItem(THEME_STORAGE_KEY)
      } else {
        window.localStorage.setItem(THEME_STORAGE_KEY, pref)
      }
    } catch {
      // The preference still applies in this tab if storage is blocked.
    }
  }

  return { theme, setTheme, cycle: () => setTheme(cycleTheme(theme)) }
}
