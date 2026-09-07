import { useCallback, useEffect, useState } from 'react'

import AsyncStorage from '@react-native-async-storage/async-storage'
import { Uniwind } from 'uniwind'

export type Appearance = 'system' | 'light' | 'dark'

export const APPEARANCE_STORAGE_KEY = '@kabiye_appearance'

const VALUES: Appearance[] = ['system', 'light', 'dark']

/** Whether a stored value is one we wrote. */
export function isAppearance(value: string | null): value is Appearance {
  return value !== null && (VALUES as string[]).includes(value)
}

/** The next setting in the cycle, so one row can carry all three. */
export function nextAppearance(current: Appearance): Appearance {
  return VALUES[(VALUES.indexOf(current) + 1) % VALUES.length]
}

/**
 * System, Light or Dark, remembered.
 *
 * The palette already has a dark half -- `global.css` defines both under `@variant` --
 * so this is a setting, not a theme. It defaults to `system`, which is what a phone
 * that switches at dusk expects; the override exists because paper-on-ink and
 * ink-on-paper read differently to different eyes, and the learner is entitled to pick.
 */
export function useAppearance() {
  const [appearance, setState] = useState<Appearance>('system')
  const [isLoading, setLoading] = useState(true)

  useEffect(function readStoredAppearance() {
    let cancelled = false

    void AsyncStorage.getItem(APPEARANCE_STORAGE_KEY).then((stored) => {
      if (cancelled) return
      if (isAppearance(stored)) {
        setState(stored)
        Uniwind.setTheme(stored)
      }
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  const setAppearance = useCallback(async (next: Appearance) => {
    setState(next)
    Uniwind.setTheme(next)
    await AsyncStorage.setItem(APPEARANCE_STORAGE_KEY, next)
  }, [])

  return { appearance, setAppearance, isLoading }
}
