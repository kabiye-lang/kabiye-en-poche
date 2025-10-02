import {
  useAlphabetLetter,
  useAlphabetLetters,
  useCmsPage,
  useCmsPages,
  useCompleteLesson,
  useLesson,
  useLessonActivities,
  useLessonContent,
  useLessonExercises,
  useLessons,
  useLessonsWithProgress,
  useNextLesson,
  useProgressSummary,
  useQuizQuestions,
  useUnit,
  useUnits,
  useUnitWithLessons,
  useUserProgress,
} from './use-units'

// Units
export function useAppUnits() {
  return useUnits()
}

export function useAppUnit(unitId: string) {
  return useUnit(unitId)
}

export function useAppUnitWithLessons(unitId: string) {
  return useUnitWithLessons(unitId)
}

// Lessons
export function useAppLessons(unitId?: string) {
  return useLessons(unitId)
}

export function useAppLesson(lessonId: string) {
  return useLesson(lessonId)
}

export function useAppLessonContent(lessonId: string) {
  return useLessonContent(lessonId)
}

export function useAppLessonExercises(lessonId: string) {
  return useLessonExercises(lessonId)
}

export function useAppLessonActivities(lessonId: string) {
  return useLessonActivities(lessonId)
}

export function useAppLessonsWithProgress(unitId: string) {
  return useLessonsWithProgress(unitId)
}

// Progress
export function useAppUserProgress() {
  return useUserProgress()
}

export function useAppNextLesson() {
  return useNextLesson()
}

export function useAppProgressSummary() {
  return useProgressSummary()
}

export function useAppCompleteLesson() {
  return useCompleteLesson()
}

// Quiz
export function useAppQuizQuestions(lessonId: string) {
  return useQuizQuestions(lessonId)
}

// Alphabet Letters
export function useAppAlphabetLetters() {
  return useAlphabetLetters()
}

export function useAppAlphabetLetter(letterId: string) {
  return useAlphabetLetter(letterId)
}

// CMS Pages
export function useAppCmsPages() {
  return useCmsPages()
}

export function useAppCmsPage(slug: string) {
  return useCmsPage(slug)
}
