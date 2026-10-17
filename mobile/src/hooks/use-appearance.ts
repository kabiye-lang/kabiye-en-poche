import { useSyncExternalStore } from 'react'

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

// One value for the whole app. The root layout feeds it to React Navigation's theme (the
// tab bar, pushed headers) and the status bar, while Profile changes it. When each caller
// kept its own copy, the root held whatever it read at launch: leaving a stored Light or
// Dark left the tab bar and headers on the old setting until the app restarted.
let snapshot: { appearance: Appearance; isLoading: boolean } = { appearance: 'system', isLoading: true }
let chosenBeforeLoad = false
let loading: Promise<void> | null = null
const listeners = new Set<() => void>()

function update(next: Partial<typeof snapshot>) {
  snapshot = { ...snapshot, ...next }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  loading ??= AsyncStorage.getItem(APPEARANCE_STORAGE_KEY)
    .then((stored) => {
      // A choice made while storage was still answering wins over the stored one.
      if (!chosenBeforeLoad && isAppearance(stored)) {
        Uniwind.setTheme(stored)
        update({ appearance: stored })
      }
    })
    .catch(() => {
      // A setting we cannot read is the same as one never chosen: follow the system.
    })
    .finally(() => update({ isLoading: false }))
  return () => {
    listeners.delete(listener)
  }
}

const getSnapshot = () => snapshot

async function setAppearance(next: Appearance) {
  chosenBeforeLoad = true
  Uniwind.setTheme(next)
  update({ appearance: next })
  await AsyncStorage.setItem(APPEARANCE_STORAGE_KEY, next)
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
  const { appearance, isLoading } = useSyncExternalStore(subscribe, getSnapshot)
  return { appearance, setAppearance, isLoading }
}
