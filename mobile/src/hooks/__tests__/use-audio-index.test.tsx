import type { ReactNode } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react-native'

import { supabase } from '../../lib/supabase'
import { findAudio } from '../../utils/find-audio'
import { useAudioIndex, useLessonAudioIndex } from '../use-audio-index'

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    storage: {
      from: () => ({ getPublicUrl: (path: string) => ({ data: { publicUrl: `https://x.supabase.co/${path}` } }) }),
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

const row = { storage_path: 'wɩʋ.m4a', kind: 'word', kbp_key: 'wɩʋ', lexeme_id: 'wɩʋ' }

describe('useLessonAudioIndex', () => {
  // Review P1: after a failed load, another screen's observer ("Look it up" opens the
  // dictionary) retries the query. Its success rebuilt the lesson's steps mid-session.
  it('keeps the index the session started with when a later fetch recovers', async () => {
    queueResults([
      { data: null, error: { message: 'network down' } },
      { data: [row], error: null },
    ])
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )

    const { result } = await renderHook(() => ({ lesson: useLessonAudioIndex('lesson-1'), live: useAudioIndex() }), {
      wrapper,
    })
    await waitFor(() => expect(result.current.lesson.isSettled).toBe(true))
    expect(result.current.lesson.index.records).toEqual([])

    await act(() => client.refetchQueries({ queryKey: ['audios', 'playable'] }))
    await waitFor(() => expect(result.current.live.index.records).toHaveLength(1))

    expect(result.current.lesson.index.records).toEqual([])
    expect(findAudio(result.current.lesson.index, { kbp: 'wɩʋ' })).toBeUndefined()
  })
})
