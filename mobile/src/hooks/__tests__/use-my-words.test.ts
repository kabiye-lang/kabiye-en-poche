import AsyncStorage from '@react-native-async-storage/async-storage'
import { act, renderHook } from '@testing-library/react-native'

import { mergeWords, MY_WORDS_KEY, recordWritten, useMyWords } from '../use-my-words'

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}))

const flush = () => new Promise((resolve) => setImmediate(resolve))

describe('useMyWords concurrency', () => {
  it('serializes addMet and markWritten so neither write erases the other', async () => {
    let store = JSON.stringify([])
    const getItem = AsyncStorage.getItem as jest.Mock
    const setItem = AsyncStorage.setItem as jest.Mock

    // A real race: each read sees storage as it was when the read *started*, and the
    // test decides when reads finish. Unserialized, both mutations would read the empty
    // store, and whichever wrote last would erase the other -- losing either the
    // lexemeId addMet records or the count markWritten records.
    const pending: (() => void)[] = []
    getItem.mockImplementation(() => {
      const snapshot = store
      return new Promise((resolve) => pending.push(() => resolve(snapshot)))
    })
    setItem.mockImplementation((_key: string, value: string) => {
      store = value
      return Promise.resolve()
    })

    const { result } = await renderHook(() => useMyWords())
    // The hook's own initial load.
    await act(async () => {
      pending.splice(0).forEach((release) => release())
      await flush()
    })

    await act(async () => {
      const both = Promise.all([
        result.current.addMet([{ headword: 'kɛlɩm', lexemeId: 'lx-1' }]),
        result.current.markWritten('kɛlɩm'),
      ])
      await flush()

      // Serialized: markWritten has not even started its read while addMet's is open.
      expect(pending).toHaveLength(1)

      // Release the newest open read first, every time -- the order that loses data
      // when two read-modify-writes overlap.
      while (pending.length > 0) {
        pending.pop()!()
        await flush()
      }
      await both
    })

    const stored = JSON.parse(store) as { headword: string; lexemeId?: string; writtenCount: number }[]
    expect(stored).toEqual([expect.objectContaining({ headword: 'kɛlɩm', lexemeId: 'lx-1', writtenCount: 1 })])
    expect(setItem).toHaveBeenLastCalledWith(MY_WORDS_KEY, store)
  })
})

describe('mergeWords', () => {
  it('saves two homographs as two words', () => {
    // Keyed by headword, saving abaa₂ after abaa₁ was dropped as already saved.
    const first = mergeWords([], [{ headword: 'abaa', lexemeId: 'abaa#1' }])
    const both = mergeWords(first, [{ headword: 'abaa', lexemeId: 'abaa#2' }])
    expect(both.map((word) => word.lexemeId)).toEqual(['abaa#1', 'abaa#2'])
  })

  it('keeps a spelling made before the lesson saved the word', () => {
    // A spell step saves the bare headword. The lesson then saves its lexeme id, which
    // must land on that row, not start a second one at 0.
    const spelled = recordWritten([], 'abaa')
    const saved = mergeWords(spelled, [{ headword: 'abaa', lexemeId: 'abaa#2' }])
    expect(saved).toEqual([{ ...spelled[0], lexemeId: 'abaa#2', writtenCount: 1 }])
  })

  it('keeps two forms a lesson saved under one lexeme id', () => {
    // A lesson saves each taught form under its word's id: `caʋ` and `caɣaɣ` are both caʋ#2.
    const forms = [
      { headword: 'caʋ', lexemeId: 'caʋ#2', firstSeen: '2026-10-01T00:00:00.000Z', writtenCount: 3 },
      { headword: 'caɣaɣ', lexemeId: 'caʋ#2', firstSeen: '2026-10-02T00:00:00.000Z', writtenCount: 0 },
    ]
    expect(mergeWords(forms, [{ headword: 'abaa', lexemeId: 'abaa#1' }]).slice(0, 2)).toEqual(forms)
  })
})
