import * as React from 'react'
import * as compilerRuntime from 'react/compiler-runtime'

import { act, renderHook } from '@testing-library/react-native'

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}))
jest.mock('uniwind', () => ({ Uniwind: { setTheme: jest.fn() } }))

const flush = () => new Promise((resolve) => setImmediate(resolve))

// The setting lives in module state, so each test loads a fresh copy of the hook. It must
// still share the renderer's React (and the React Compiler runtime that calls into it).
function load(stored: Promise<string | null>) {
  jest.resetModules()
  jest.doMock('react', () => React)
  jest.doMock('react/compiler-runtime', () => compilerRuntime)
  const AsyncStorage = require('@react-native-async-storage/async-storage')
  AsyncStorage.getItem.mockReturnValue(stored)
  AsyncStorage.setItem.mockResolvedValue(undefined)
  return require('../use-appearance') as typeof import('../use-appearance')
}

describe('useAppearance', () => {
  it('keeps every caller on one value, so the root layout sees what Profile sets', async () => {
    // The root layout feeds the setting to the navigation theme (tab bar, headers) and the
    // status bar; Profile changes it. When each caller held its own copy, the root kept
    // what it read at launch: leaving a stored Dark for System left the tab bar dark.
    const { useAppearance } = load(Promise.resolve('dark'))
    const root = await renderHook(() => useAppearance())
    const profile = await renderHook(() => useAppearance())
    await act(flush)
    expect(root.result.current.appearance).toBe('dark')

    await act(() => profile.result.current.setAppearance('system'))

    expect(root.result.current.appearance).toBe('system')
  })

  it('does not let a slow storage read undo a choice made before it answered', async () => {
    let answer: (value: string | null) => void = () => {}
    const { useAppearance } = load(new Promise((resolve) => (answer = resolve)))
    const { result } = await renderHook(() => useAppearance())

    await act(() => result.current.setAppearance('light'))
    await act(async () => {
      answer('dark')
      await flush()
    })

    expect(result.current.appearance).toBe('light')
    expect(result.current.isLoading).toBe(false)
  })
})
