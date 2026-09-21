import type { LessonStep } from '../../types/lesson-steps'

import AsyncStorage from '@react-native-async-storage/async-storage'
import { act, renderHook } from '@testing-library/react-native'

import { readLessonSessionSummary, useLessonSession } from '../use-lesson-session'

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}))

const flush = () => new Promise((resolve) => setImmediate(resolve))

const lessonSteps = (n: number): LessonStep[] =>
  Array.from({ length: n }, (_, i) => ({ id: `s${i}`, type: 'content', order: i, content: 'x' }) as LessonStep)

describe('useLessonSession', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('writes nothing before hydration resolves, and hydration itself only reads', async () => {
    const getItem = AsyncStorage.getItem as jest.Mock
    const setItem = AsyncStorage.setItem as jest.Mock
    let releaseRead: (() => void) | undefined
    getItem.mockImplementation(
      () =>
        new Promise((resolve) => {
          releaseRead = () => resolve(null)
        })
    )

    const { result } = await renderHook(() => useLessonSession('lesson-1', lessonSteps(4)))
    expect(result.current.session).toBeNull()
    expect(setItem).not.toHaveBeenCalled()

    await act(async () => {
      releaseRead?.()
      await flush()
    })

    expect(result.current.session).not.toBeNull()
    expect(setItem).not.toHaveBeenCalled() // hydration only reads

    await act(async () => {
      result.current.advance()
      await flush()
    })
    expect(setItem).toHaveBeenCalledTimes(1)
  })

  it('a write superseded before its turn is skipped -- only the newest revision is ever persisted', async () => {
    const getItem = AsyncStorage.getItem as jest.Mock
    const setItem = AsyncStorage.setItem as jest.Mock
    getItem.mockResolvedValue(null)

    // setItem never resolves on its own -- the test decides when each call completes, so
    // a write can be left "in flight" while later session changes happen around it.
    const pending: (() => void)[] = []
    setItem.mockImplementation(() => new Promise<void>((resolve) => pending.push(resolve)))

    const { result } = await renderHook(() => useLessonSession('lesson-2', lessonSteps(4)))
    await act(async () => {
      await flush()
    })
    expect(result.current.session).not.toBeNull()

    // Revision 1: let its write actually start (call setItem) before anything else happens.
    await act(async () => {
      result.current.advance()
      await flush()
    })
    expect(setItem).toHaveBeenCalledTimes(1)

    // Revisions 2 and 3 land while revision 1's write is still unresolved -- both queue
    // behind it, neither has run yet.
    await act(async () => {
      result.current.advance()
      result.current.advance()
      await flush()
    })
    expect(setItem).toHaveBeenCalledTimes(1)

    // Release revision 1's write. The chain moves on to revision 2's turn: by now
    // revision 3 is the latest for this key, so revision 2 is skipped without ever
    // calling setItem. Revision 3's turn follows immediately and does call it.
    await act(async () => {
      pending.splice(0).forEach((release) => release())
      await flush()
      await flush()
    })

    // Two calls total, not three: revision 1 (already issued before it could be
    // superseded) and revision 3 (the newest). Revision 2 never reached storage.
    expect(setItem).toHaveBeenCalledTimes(2)
    const finalPayload = JSON.parse(setItem.mock.calls[1][1] as string)
    expect(finalPayload.lessonIndex).toBe(3) // the state after all three advances
  })

  it('removal failure on completion still lets the caller proceed', async () => {
    const getItem = AsyncStorage.getItem as jest.Mock
    const removeItem = AsyncStorage.removeItem as jest.Mock
    getItem.mockResolvedValue(null)
    removeItem.mockRejectedValue(new Error('disk full'))

    const { result } = await renderHook(() => useLessonSession('lesson-3', lessonSteps(4)))
    await act(async () => {
      await flush()
    })

    await expect(result.current.clear()).resolves.toBeUndefined()
    expect(removeItem).toHaveBeenCalled()
  })
})

describe('readLessonSessionSummary', () => {
  const getItem = AsyncStorage.getItem as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns null when nothing is stored', async () => {
    getItem.mockResolvedValue(null)
    expect(await readLessonSessionSummary('lesson-x')).toBeNull()
  })

  it('reports lesson progress from a valid stored session', async () => {
    getItem.mockResolvedValue(
      JSON.stringify({
        v: 1,
        phase: 'lesson',
        lessonIndex: 2,
        reviewStepIds: [],
        reviewIndex: 0,
        answers: {},
        shown: [],
        lessonStepCount: 6,
      })
    )
    expect(await readLessonSessionSummary('lesson-x')).toEqual({ kind: 'lesson', current: 3, total: 6 })
  })

  it('reports review without a counter', async () => {
    getItem.mockResolvedValue(
      JSON.stringify({
        v: 1,
        phase: 'review',
        lessonIndex: 5,
        reviewStepIds: ['a', 'b'],
        reviewIndex: 1,
        answers: {},
        shown: [],
        lessonStepCount: 6,
      })
    )
    expect(await readLessonSessionSummary('lesson-x')).toEqual({ kind: 'review' })
  })

  it('returns null for a finished session -- nothing left to resume', async () => {
    getItem.mockResolvedValue(
      JSON.stringify({
        v: 1,
        phase: 'finish',
        lessonIndex: 5,
        reviewStepIds: [],
        reviewIndex: 0,
        answers: {},
        shown: [],
        lessonStepCount: 6,
      })
    )
    expect(await readLessonSessionSummary('lesson-x')).toBeNull()
  })

  it('is non-throwing for corrupt JSON', async () => {
    getItem.mockResolvedValue('{not json')
    expect(await readLessonSessionSummary('lesson-x')).toBeNull()
  })

  it('rejects an out-of-range lessonIndex against the stored count', async () => {
    getItem.mockResolvedValue(
      JSON.stringify({
        v: 1,
        phase: 'lesson',
        lessonIndex: 9,
        reviewStepIds: [],
        reviewIndex: 0,
        answers: {},
        shown: [],
        lessonStepCount: 6,
      })
    )
    expect(await readLessonSessionSummary('lesson-x')).toBeNull()
  })

  it('rejects a review session already past its last item, as decode does', async () => {
    getItem.mockResolvedValue(
      JSON.stringify({
        v: 1,
        phase: 'review',
        lessonIndex: 5,
        reviewStepIds: ['a', 'b'],
        reviewIndex: 2,
        answers: {},
        shown: [],
        lessonStepCount: 6,
      })
    )
    expect(await readLessonSessionSummary('lesson-x')).toBeNull()
  })
})
