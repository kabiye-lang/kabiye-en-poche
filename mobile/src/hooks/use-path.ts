import { useCallback, useEffect, useState } from 'react'

import AsyncStorage from '@react-native-async-storage/async-storage'

/**
 * Where Kabiyè sits in this learner's life.
 *
 * The app serves three audiences at once and they want different things from the same
 * screen: someone who already speaks Kabiyè and cannot write it, someone who grew up
 * hearing it, and someone meeting it for the first time. Asking once, at the start, is
 * cheaper than guessing forever -- and it is the only personalisation the product has,
 * because there is no account and nothing is sent anywhere.
 */
export type LearnerPath = 'speaker' | 'heritage' | 'new'

export const PATH_STORAGE_KEY = '@kabiye_path'

/**
 * How each path reorders the curriculum.
 *
 * A fluent speaker learning to write starts at the orthography, because that is the gap.
 * A beginner starts at greetings, because the alphabet is not why they came. Someone who
 * grew up hearing the language sits between the two and gets the default order.
 *
 * Matching is on unit code so a renamed unit keeps its place. Codes not listed keep
 * their `position` order after the ones that are.
 */
export const PATH_UNIT_ORDER: Record<LearnerPath, string[]> = {
  speaker: ['U001', 'U003', 'U002'],
  heritage: [],
  new: ['U003', 'U001', 'U002'],
}

/** Sort units for a path, leaving unlisted ones in their existing order behind. */
export function orderUnitsForPath<T extends { code?: string | null }>(
  units: T[],
  path: LearnerPath | null
): T[] {
  if (!path) return units
  const preferred = PATH_UNIT_ORDER[path]
  if (preferred.length === 0) return units
  const rank = (unit: T) => {
    const index = preferred.indexOf(unit.code ?? '')
    return index === -1 ? preferred.length : index
  }
  // Stable: units sharing a rank keep the order they arrived in.
  return [...units].sort((a, b) => rank(a) - rank(b))
}

export function usePath() {
  const [path, setPathState] = useState<LearnerPath | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    AsyncStorage.getItem(PATH_STORAGE_KEY)
      .then((stored) => {
        if (cancelled) return
        setPathState(stored === 'speaker' || stored === 'heritage' || stored === 'new' ? stored : null)
      })
      .catch(() => {
        // A path we cannot read is the same as one never chosen: the app still works,
        // it just uses the default order.
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const setPath = useCallback(async (next: LearnerPath) => {
    setPathState(next)
    await AsyncStorage.setItem(PATH_STORAGE_KEY, next)
  }, [])

  return { path, setPath, isLoading }
}
