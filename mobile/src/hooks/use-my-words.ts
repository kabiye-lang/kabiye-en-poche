import { useCallback, useEffect, useState } from 'react'

import AsyncStorage from '@react-native-async-storage/async-storage'

/**
 * The words this learner has saved -- from finishing a lesson or bookmarking a
 * dictionary entry -- and whether they have written any of them.
 *
 * Local only. There is no account, so this is the whole record of what someone has
 * saved, and it is the only number the Profile screen can honestly report: not a
 * percentage of a curriculum that is 7/78 written, but how many words are saved and how
 * many they have spelled correctly at least once. Because a bookmark lands here the same
 * way a lesson word does, the total is "words saved", never "words met" -- the app has
 * no way to tell the two apart once they are in this list.
 */
export interface MyWord {
  headword: string
  lexemeId?: string
  firstSeen: string
  /** How many times the learner has spelled it correctly. 0 means met but not written. */
  writtenCount: number
}

export const MY_WORDS_KEY = '@kabiye_my_words'

/** Merge newly-met words into the stored list without losing what was already written. */
export function mergeWords(existing: MyWord[], met: { headword: string; lexemeId?: string }[]): MyWord[] {
  const byHeadword = new Map(existing.map((word) => [word.headword, word]))
  for (const word of met) {
    if (!word.headword) continue
    if (!byHeadword.has(word.headword)) {
      byHeadword.set(word.headword, {
        headword: word.headword,
        lexemeId: word.lexemeId,
        firstSeen: new Date().toISOString(),
        writtenCount: 0,
      })
    }
  }
  return [...byHeadword.values()]
}

/** Record that a word was spelled correctly. Adds it if it was not already known. */
export function recordWritten(existing: MyWord[], headword: string): MyWord[] {
  const found = existing.find((word) => word.headword === headword)
  if (!found) {
    return [...existing, { headword, firstSeen: new Date().toISOString(), writtenCount: 1 }]
  }
  return existing.map((word) => (word.headword === headword ? { ...word, writtenCount: word.writtenCount + 1 } : word))
}

async function read(): Promise<MyWord[]> {
  try {
    const raw = await AsyncStorage.getItem(MY_WORDS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    // A list we cannot read is the same as an empty one. Losing it costs the learner a
    // count, not their progress through the lessons, which lives elsewhere.
    return []
  }
}

/**
 * Every mutation runs through this one chain, in call order.
 *
 * `addMet` (finishing a lesson, or bookmarking from the dictionary) and `markWritten` (a
 * correct spell answer) each read storage, then write it back. Fired without waiting on
 * each other -- a lesson finishing while a bookmark from the same word's dictionary
 * entry is still landing -- both would read the same starting state, and whichever wrote
 * last would silently erase the other's change. Queuing means a mutation's read never
 * happens until the one queued before it has finished writing.
 */
let queue: Promise<unknown> = Promise.resolve()
function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const result = queue.then(fn, fn)
  // The chain must keep moving even if a mutation throws, or every mutation queued
  // after it would wait on a promise that never resolves.
  queue = result.then(
    () => undefined,
    () => undefined
  )
  return result
}

export function useMyWords() {
  const [words, setWords] = useState<MyWord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    setWords(await read())
    setIsLoading(false)
  }, [])

  // Named so the intent is readable, and the state update is awaited rather than set
  // synchronously inside the effect body -- the lint rule exists because the synchronous
  // form re-renders before the effect finishes.
  useEffect(function loadStoredWords() {
    let cancelled = false
    read()
      .then((stored) => {
        if (cancelled) return
        setWords(stored)
        setIsLoading(false)
      })
      .catch(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const addMet = useCallback(
    (met: { headword: string; lexemeId?: string }[]) =>
      enqueue(async () => {
        const next = mergeWords(await read(), met)
        await AsyncStorage.setItem(MY_WORDS_KEY, JSON.stringify(next))
        setWords(next)
        return next
      }),
    []
  )

  const markWritten = useCallback(
    (headword: string) =>
      enqueue(async () => {
        const next = recordWritten(await read(), headword)
        await AsyncStorage.setItem(MY_WORDS_KEY, JSON.stringify(next))
        setWords(next)
        return next
      }),
    []
  )

  return {
    words,
    isLoading,
    refresh,
    addMet,
    markWritten,
    /** Entries in My words -- lesson words and dictionary bookmarks. */
    savedCount: words.length,
    /** Words spelled correctly at least once. */
    writtenCount: words.filter((word) => word.writtenCount > 0).length,
  }
}
