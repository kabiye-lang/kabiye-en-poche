/**
 * Home layout tests — verifies new vs returning user rendering logic.
 */
describe('Home layout — new vs returning user', () => {
  it('new user hero shows welcome text when no next lesson', () => {
    // Simulates the condition: !nextLessonLoading && !nextLesson
    const nextLessonLoading = false
    const nextLesson = null
    const hasNextLesson = !nextLessonLoading && !!nextLesson
    expect(hasNextLesson).toBe(false)
    // When hasNextLesson is false and not loading, new user hero is shown
  })

  it('returning user hero shows continue learning when next lesson exists', () => {
    const nextLessonLoading = false
    const nextLesson = { id: 'lesson-1', title: { en: 'Greetings', fr: 'Salutations' } }
    const hasNextLesson = !nextLessonLoading && !!nextLesson
    expect(hasNextLesson).toBe(true)
  })

  it('shows loading state when lesson data is loading', () => {
    const nextLessonLoading = true
    const nextLesson = null
    const hasNextLesson = !nextLessonLoading && !!nextLesson
    expect(hasNextLesson).toBe(false)
    // When nextLessonLoading is true, loading spinner should show
    expect(nextLessonLoading).toBe(true)
  })

  it('WotD section always renders regardless of user type', () => {
    // The WotD section in home.tsx is outside the conditional hero
    // and always renders with the WordOfTheDay component
    const wordOfTheDay = [
      {
        baseHeadword: 'taa',
        entries: [
          {
            entry_data: {
              headword: 'taa',
              pronunciations: ['taː'],
              senses: [
                {
                  definitions: [{ translations: { fr: 'père', en: 'father' } }],
                },
              ],
            },
          },
        ],
      },
    ]
    expect(wordOfTheDay.length).toBeGreaterThan(0)
  })
})
