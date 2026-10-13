import type { ReactNode } from 'react'
import type { LessonExample, LessonStep } from '../../types/lesson-steps'
import type { LessonActivity, Tables } from '../../types/supabase'

import { useMemo } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react-native'

import { supabase } from '../../lib/supabase'
import { buildLessonSteps, taughtWords } from '../../utils/build-lesson-steps'
import { DEV_AUDIO_FIXTURE_URI } from '../../utils/dev-audio-fixture'
import { useAudioIndex, useLessonAudio } from '../use-audio-index'
import { audioSnapshotKey, sessionKey, useLessonSession } from '../use-lesson-session'

// An in-memory store: the session and the audio snapshot must survive an unmount.
const mockStore = new Map<string, string>()
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(mockStore.get(key) ?? null)),
  setItem: jest.fn((key: string, value: string) => {
    mockStore.set(key, value)
    return Promise.resolve()
  }),
  removeItem: jest.fn((key: string) => {
    mockStore.delete(key)
    return Promise.resolve()
  }),
}))

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { supabase: { url: 'https://isdeilllppdfngxmsols.supabase.co' } } } },
}))

const HOSTED = 'https://isdeilllppdfngxmsols.supabase.co/storage/v1/object/public/audios/'

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    storage: {
      from: () => ({
        getPublicUrl: (path: string) => ({
          data: { publicUrl: `https://isdeilllppdfngxmsols.supabase.co/storage/v1/object/public/audios/${path}` },
        }),
      }),
    },
  },
}))

type Result = { data: unknown[] | null; error: unknown }

/** Each `from('audios')` chain resolves to the next queued result. */
function queueResults(results: Result[]) {
  const queue = [...results]
  ;(supabase.from as jest.Mock).mockImplementation(() => {
    const builder = {
      select: () => builder,
      eq: () => builder,
      order: () => builder,
      range: () => builder,
      then: (resolve: (value: Result) => unknown, reject: (reason: unknown) => unknown) =>
        Promise.resolve(queue.shift() as Result).then(resolve, reject),
    }
    return builder
  })
}

const wiuRow = { storage_path: 'wɩʋ.m4a', kind: 'word', kbp_key: 'wɩʋ', lexeme_id: 'wɩʋ' }

const wrapperFor = (client: QueryClient) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }

const noRetryClient = () => new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })

// A small lesson, as in build-lesson-steps.test.ts. Headwords from the dictionary; the
// notes are English placeholders, not Kabiyè.
const word = (kbp: string, lexeme_id?: string): LessonExample => ({
  kbp,
  lexeme_id,
  en: `gloss of ${kbp}`,
  note: { en: 'n' },
})
const section = (index: number, examples: LessonExample[]): Tables<'lesson_contents'> => ({
  id: `c${index}`,
  lesson_id: 'L',
  kind: 'prose',
  position: index,
  created_at: null,
  title_en: `Section ${index}`,
  title_fr: `Section ${index}`,
  content_en: `Rule ${index}`,
  content_fr: `Règle ${index}`,
  examples: examples as unknown as Tables<'lesson_contents'>['examples'],
})
const contents = [section(0, [word('keɖe', 'keɖe#1'), word('tamaɣ', 'tamaɣ#1')]), section(1, [word('wɩʋ', 'wɩʋ')])]
const activities: LessonActivity[] = [
  {
    id: 'a1',
    lesson_id: 'L',
    activity_type: 'spell',
    data: { correct: 'keɖe' } as LessonActivity['data'],
    position: 0,
    created_at: null,
    question_en: null,
    question_fr: null,
    instructions_en: null,
    instructions_fr: null,
  },
]
const getValue = (obj: object | null | undefined, field: string) =>
  ((obj as Record<string, string> | null)?.[`${field}_en`] as string | undefined) ?? null
const NO_STEPS: LessonStep[] = []

/** The lesson screen's wiring: recordings -> steps -> saved session. */
function useLessonUnderTest(lessonId: string) {
  const { words, sectionOf } = useMemo(() => taughtWords(contents), [])
  const audio = useLessonAudio(lessonId, words, true)
  const lessonSteps = useMemo(
    () =>
      buildLessonSteps({ lessonId, contents, activities, words, sectionOf, getValue, audioFor: audio.audioFor }).slice(
        0,
        -1
      ),
    [lessonId, words, sectionOf, audio.audioFor]
  )
  const lessonSession = useLessonSession(lessonId, audio.isSettled ? lessonSteps : NO_STEPS)
  return { audio, lessonSteps, lessonSession }
}

beforeEach(() => {
  mockStore.clear()
  jest.spyOn(console, 'warn').mockImplementation(() => {})
})

describe('useAudioIndex', () => {
  // Review round 2 (P2): `retry: false` turned one transient failure into a whole
  // audio-less session.
  it('retries a failed load with the client defaults', async () => {
    queueResults([
      { data: null, error: { message: 'network blip' } },
      { data: [wiuRow], error: null },
    ])
    const client = new QueryClient({ defaultOptions: { queries: { retry: 1, retryDelay: 0, gcTime: Infinity } } })

    const { result } = await renderHook(() => useAudioIndex(), { wrapper: wrapperFor(client) })
    await waitFor(() => expect(result.current.isSettled).toBe(true))

    expect(result.current.index.records).toHaveLength(1)
  })
})

describe('useLessonAudio', () => {
  // Review P1 (round 1): after a failed load, another screen's observer ("Look it up" opens
  // the dictionary) retries the query. Its success rebuilt the lesson's steps mid-session.
  it('keeps the recordings the session started with when a later fetch recovers', async () => {
    queueResults([
      { data: null, error: { message: 'network down' } },
      { data: [wiuRow], error: null },
    ])
    const client = noRetryClient()
    const wiu = word('wɩʋ', 'wɩʋ')

    const { result } = await renderHook(() => ({ lesson: useLessonAudio('L', [wiu], true), live: useAudioIndex() }), {
      wrapper: wrapperFor(client),
    })
    await waitFor(() => expect(result.current.lesson.isSettled).toBe(true))
    expect(result.current.lesson.audioFor(wiu)).toBeUndefined()

    await act(() => client.refetchQueries({ queryKey: ['audios', 'playable'] }))
    await waitFor(() => expect(result.current.live.index.records).toHaveLength(1))

    expect(result.current.lesson.audioFor(wiu)).toBeUndefined()
  })

  // Review round 2 (P1): the snapshot lived in component state and died with the screen.
  // A recording approved between two visits added a listening step, the fingerprint
  // changed, and the saved session was deleted.
  it('resumes a saved session at the same step with the same steps after a recording is approved', async () => {
    queueResults([{ data: [], error: null }])
    const first = await renderHook(() => useLessonUnderTest('L'), { wrapper: wrapperFor(noRetryClient()) })
    await waitFor(() => expect(first.result.current.lessonSession.isHydrated).toBe(true))

    const stepIds = first.result.current.lessonSteps.map((step) => step.id)
    expect(stepIds.some((id) => id.includes('listen'))).toBe(false)
    await act(async () => {
      first.result.current.lessonSession.advance()
      first.result.current.lessonSession.advance()
      first.result.current.lessonSession.advance()
      await first.result.current.lessonSession.flush()
    })
    expect(first.result.current.lessonSession.session).toMatchObject({ phase: 'lesson', lessonIndex: 3 })
    await first.unmount()

    // Meanwhile a recording of `wɩʋ` is approved. A fresh client: the app was restarted.
    queueResults([{ data: [wiuRow], error: null }])
    const second = await renderHook(() => useLessonUnderTest('L'), { wrapper: wrapperFor(noRetryClient()) })
    await waitFor(() => expect(second.result.current.lessonSession.isHydrated).toBe(true))

    expect(second.result.current.lessonSteps.map((step) => step.id)).toEqual(stepIds)
    expect(second.result.current.lessonSession.session).toMatchObject({ phase: 'lesson', lessonIndex: 3 })
  })

  // Final review (P2): a session saved by the version before audio has no snapshot. It was
  // seeded from today's recordings, a listening step changed its fingerprint, and hydration
  // deleted the learner's progress.
  it('keeps the progress of a session saved before snapshots existed', async () => {
    queueResults([{ data: [], error: null }])
    const first = await renderHook(() => useLessonUnderTest('L'), { wrapper: wrapperFor(noRetryClient()) })
    await waitFor(() => expect(first.result.current.lessonSession.isHydrated).toBe(true))
    const stepIds = first.result.current.lessonSteps.map((step) => step.id)
    await act(async () => {
      first.result.current.lessonSession.advance()
      first.result.current.lessonSession.advance()
      first.result.current.lessonSession.advance()
      await first.result.current.lessonSession.flush()
    })
    await first.unmount()
    // The older app version wrote the session and nothing else.
    mockStore.delete(audioSnapshotKey('L'))

    queueResults([{ data: [wiuRow], error: null }])
    const second = await renderHook(() => useLessonUnderTest('L'), { wrapper: wrapperFor(noRetryClient()) })
    await waitFor(() => expect(second.result.current.lessonSession.isHydrated).toBe(true))

    expect(second.result.current.lessonSteps.map((step) => step.id)).toEqual(stepIds)
    expect(second.result.current.lessonSession.session).toMatchObject({ phase: 'lesson', lessonIndex: 3 })
  })

  // Final review (P2): restored URLs skipped `usableAudioUrl`, so a snapshot holding the
  // Metro-served fixture still played after the flag was turned off or in a release build.
  it('plays nothing from a restored snapshot that holds no recording we host', async () => {
    expect(DEV_AUDIO_FIXTURE_URI).toBeUndefined() // the fixture flag is off in this test
    const wiu = word('wɩʋ', 'wɩʋ')
    mockStore.set(sessionKey('L'), '{"phase":"lesson"}')
    mockStore.set(
      audioSnapshotKey('L'),
      JSON.stringify({ 'wɩʋ|wɩʋ': 'http://192.168.1.20:8081/assets/assets/audio/dev-fixture-tone.m4a' })
    )
    queueResults([{ data: [wiuRow], error: null }])

    const { result } = await renderHook(() => useLessonAudio('L', [wiu], true), {
      wrapper: wrapperFor(noRetryClient()),
    })
    await waitFor(() => expect(result.current.isSettled).toBe(true))

    expect(result.current.audioFor(wiu)).toBeUndefined()
    // Discarded, and the saved session keeps the empty snapshot it had before audio.
    await waitFor(() => expect(mockStore.get(audioSnapshotKey('L'))).toBe('{}'))
  })

  it('drops only the restored entries that fail, and keeps the rest', async () => {
    const wiu = word('wɩʋ', 'wɩʋ')
    const keɖe = word('keɖe', 'keɖe#1')
    mockStore.set(sessionKey('L'), '{"phase":"lesson"}')
    mockStore.set(
      audioSnapshotKey('L'),
      JSON.stringify({ 'wɩʋ|wɩʋ': `${HOSTED}wɩʋ.m4a`, 'keɖe#1|keɖe': 'https://example.com/keɖe.m4a' })
    )
    queueResults([{ data: [], error: null }])

    const { result } = await renderHook(() => useLessonAudio('L', [wiu, keɖe], true), {
      wrapper: wrapperFor(noRetryClient()),
    })
    await waitFor(() => expect(result.current.isSettled).toBe(true))

    expect(result.current.audioFor(wiu)).toBe(`${HOSTED}wɩʋ.m4a`)
    expect(result.current.audioFor(keɖe)).toBeUndefined()
  })

  it('gives a new session the recordings approved since, once there is no session to resume', async () => {
    queueResults([{ data: [], error: null }])
    const first = await renderHook(() => useLessonUnderTest('L'), { wrapper: wrapperFor(noRetryClient()) })
    await waitFor(() => expect(first.result.current.lessonSession.isHydrated).toBe(true))
    // Completing the lesson clears both.
    await act(async () => {
      await first.result.current.lessonSession.clear()
      await first.result.current.audio.clear()
    })
    await first.unmount()

    queueResults([{ data: [wiuRow], error: null }])
    const second = await renderHook(() => useLessonUnderTest('L'), { wrapper: wrapperFor(noRetryClient()) })
    await waitFor(() => expect(second.result.current.lessonSession.isHydrated).toBe(true))

    const listening = second.result.current.lessonSteps.find((step) => step.id.includes('listen'))
    expect(listening).toMatchObject({ wordKbp: 'wɩʋ' })
    expect(second.result.current.audio.audioFor(word('wɩʋ', 'wɩʋ'))).toBe(`${HOSTED}wɩʋ.m4a`)
  })
})
