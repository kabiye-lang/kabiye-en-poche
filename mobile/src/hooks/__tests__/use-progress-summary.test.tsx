import type { ReactNode } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react-native'

import { supabase } from '../../lib/supabase'
import { useProgressSummary } from '../use-units'

jest.mock('../../lib/supabase', () => ({ supabase: { from: jest.fn() } }))
jest.mock('../../utils/local-storage', () => ({
  localProgressStorage: { getCompletedLessonIds: jest.fn().mockResolvedValue([]) },
}))

type Result = { data?: unknown; count?: number | null; error: unknown }

/**
 * Stands in for the three Supabase queries the hook awaits, in order: units, then the
 * written lessons, then the planned count. Each `from(...)` chain resolves to the next
 * queued result when awaited.
 */
function queueResults(results: Result[]) {
  const queue = [...results]
  ;(supabase.from as jest.Mock).mockImplementation(() => {
    const builder = {
      select: () => builder,
      in: () => builder,
      then: (resolve: (value: Result) => unknown, reject: (reason: unknown) => unknown) =>
        Promise.resolve(queue.shift() as Result).then(resolve, reject),
    }
    return builder
  })
}

function wrapper({ children }: { children: ReactNode }) {
  // `gcTime: Infinity` schedules no garbage-collection timer, which otherwise held the
  // Jest process open for five minutes after the last test.
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

const unitsOk: Result = { data: [{ id: 'u1', status: 'available' }], error: null }
const lessonsOk: Result = { data: [{ id: 'l1', unit_id: 'u1', status: null }], error: null }
const plannedOk: Result = { count: 12, error: null }
const failure = { message: 'network down' }

describe('useProgressSummary', () => {
  it('reports the counts when every query succeeds', async () => {
    queueResults([unitsOk, lessonsOk, plannedOk])
    const { result } = await renderHook(() => useProgressSummary(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toMatchObject({ totalLessons: 1, plannedLessons: 12 })
  })

  it.each([
    ['units', [{ data: null, error: failure }, lessonsOk, plannedOk]],
    ['lessons', [unitsOk, { data: null, error: failure }, plannedOk]],
    ['planned count', [unitsOk, lessonsOk, { count: null, error: failure }]],
  ])('fails, rather than reporting zero, when the %s query errors', async (_name, results) => {
    queueResults(results as Result[])
    const { result } = await renderHook(() => useProgressSummary(), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data).toBeUndefined()
  })
})
