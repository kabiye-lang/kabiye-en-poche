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
 * Unit codes are the five-level map's (`A1-01` Writing & Sound, `A1-02` The Sentence
 * Spine, `A1-03` Greetings & People, `A1-04` Numbers, Time & Days, `A1-06` Home, Food &
 * Market). The table held the flat map's `U001`-style codes for a while after the map
 * changed, so nothing matched and every learner got the same order -- the onboarding
 * promises below were not being kept. A test now pins each promise to a code.
 *
 * A fluent speaker learning to write starts at the orthography, because that is the gap:
 * the default order, stated. A beginner is promised greetings first, then needs the
 * alphabet early to read anything else. Someone who grew up hearing the language is
 * promised "the words you half-remember": the everyday vocabulary units before the
 * writing and the grammar spine.
 *
 * Matching is on unit code so a renamed unit keeps its place. Codes not listed keep
 * their `position` order after the ones that are.
 */
export const PATH_UNIT_ORDER: Record<LearnerPath, string[]> = {
  speaker: ['A1-01', 'A1-02'],
  heritage: ['A1-03', 'A1-06', 'A1-04', 'A1-01', 'A1-02'],
  new: ['A1-03', 'A1-01', 'A1-02'],
}

/** The stored value, or null for anything that is not one of the three paths. */
export function parsePath(stored: string | null | undefined): LearnerPath | null {
  return stored === 'speaker' || stored === 'heritage' || stored === 'new' ? stored : null
}

/** Sort units for a path, leaving unlisted ones in their existing order behind. */
export function orderUnitsForPath<T extends { code?: string | null }>(units: T[], path: LearnerPath | null): T[] {
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
        setPathState(parsePath(stored))
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
