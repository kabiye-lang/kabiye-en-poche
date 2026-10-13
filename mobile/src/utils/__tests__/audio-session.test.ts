const mockSetAudioModeAsync = jest.fn()

jest.mock('expo-audio', () => ({
  setAudioModeAsync: (mode: unknown) => mockSetAudioModeAsync(mode),
}))

// The module caches its promise, so each test loads a fresh copy.
const load = (): (() => Promise<void>) => {
  let configure!: () => Promise<void>
  jest.isolateModules(() => {
    configure = require('../audio-session').configureAudioSession
  })
  return configure
}

beforeEach(() => {
  mockSetAudioModeAsync.mockReset()
})

describe('configureAudioSession', () => {
  // A swallowed rejection looked like success: the caller never knew the silent switch
  // would still mute playback.
  it('rejects when the mode cannot be set, and tries again on the next call', async () => {
    mockSetAudioModeAsync.mockRejectedValueOnce(new Error('session busy')).mockResolvedValueOnce(undefined)
    const configure = load()

    await expect(configure()).rejects.toThrow('session busy')
    await expect(configure()).resolves.toBeUndefined()
    expect(mockSetAudioModeAsync).toHaveBeenCalledTimes(2)
  })

  it('sets the mode once it has succeeded', async () => {
    mockSetAudioModeAsync.mockResolvedValue(undefined)
    const configure = load()

    await configure()
    await configure()
    expect(mockSetAudioModeAsync).toHaveBeenCalledTimes(1)
    expect(mockSetAudioModeAsync).toHaveBeenCalledWith(expect.objectContaining({ playsInSilentMode: true }))
  })
})
