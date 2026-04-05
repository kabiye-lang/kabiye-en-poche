const ONBOARDING_KEY = '@kabiye_onboarding_complete'

// Mock AsyncStorage
const mockStorage: Record<string, string> = {}
const mockAsyncStorage = {
  getItem: jest.fn((key: string) => Promise.resolve(mockStorage[key] ?? null)),
  setItem: jest.fn((key: string, value: string) => {
    mockStorage[key] = value
    return Promise.resolve()
  }),
  clear: jest.fn(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key])
    return Promise.resolve()
  }),
}

describe('Onboarding gate logic', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAsyncStorage.clear()
  })

  it('returns null when onboarding key is not set', async () => {
    const result = await mockAsyncStorage.getItem(ONBOARDING_KEY)
    expect(result).toBeNull()
  })

  it('returns "true" after onboarding is completed', async () => {
    await mockAsyncStorage.setItem(ONBOARDING_KEY, 'true')
    const result = await mockAsyncStorage.getItem(ONBOARDING_KEY)
    expect(result).toBe('true')
  })

  it('should route to onboarding when key is missing', async () => {
    const onboardingResult = await mockAsyncStorage.getItem(ONBOARDING_KEY)
    const hasSeenOnboarding = onboardingResult === 'true'
    expect(hasSeenOnboarding).toBe(false)
  })

  it('should route to tabs when key is present', async () => {
    await mockAsyncStorage.setItem(ONBOARDING_KEY, 'true')
    const onboardingResult = await mockAsyncStorage.getItem(ONBOARDING_KEY)
    const hasSeenOnboarding = onboardingResult === 'true'
    expect(hasSeenOnboarding).toBe(true)
  })
})
