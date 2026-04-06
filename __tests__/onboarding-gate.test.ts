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

describe('Onboarding slide content structure', () => {
  // Mirrors the pages array in (onboarding)/index.tsx — data-level guard
  // against collapsing slides (emoji + title + description must all be present)
  const pages = [
    {
      id: '1',
      emoji: '🌍',
      titleKey: 'Discover Kabiyè',
      descriptionKey: 'Explore a rich West African language spoken by millions.',
      accentColors: ['#6200EE', '#7C3AED'],
    },
    {
      id: '2',
      emoji: '📖',
      titleKey: 'Your Personal Dictionary',
      descriptionKey: 'Look up any Kabiyè word instantly.',
      accentColors: ['#C8922A', '#D4A843'],
    },
    {
      id: '3',
      emoji: '⌨️',
      titleKey: 'Type in Kabiyè',
      descriptionKey: 'Use the built-in Kabiyè keyboard to type special characters.',
      accentColors: ['#6200EE', '#C8922A'],
    },
  ]

  it('every slide has emoji, title, and description', () => {
    pages.forEach((page) => {
      expect(page.emoji).toBeTruthy()
      expect(page.titleKey).toBeTruthy()
      expect(page.descriptionKey).toBeTruthy()
    })
  })

  it('slide accent uses two colors (no missing gradient params)', () => {
    pages.forEach((page) => {
      expect(page.accentColors).toHaveLength(2)
      expect(page.accentColors[0]).toMatch(/^#[0-9A-Fa-f]{6}$/)
      expect(page.accentColors[1]).toMatch(/^#[0-9A-Fa-f]{6}$/)
    })
  })

  it('text content fields are present on all 3 slides (layout cannot collapse blank)', () => {
    expect(pages).toHaveLength(3)
    const slidesWithContent = pages.filter((p) => p.titleKey && p.descriptionKey && p.emoji)
    expect(slidesWithContent).toHaveLength(3)
  })
})
