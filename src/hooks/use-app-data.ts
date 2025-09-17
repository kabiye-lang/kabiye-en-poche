import {
  useCompleteLesson,
  useLesson,
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

/**
 * App data hooks that use the new units/lessons structure
 */

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

export function useAppLessonsWithProgress(unitId: string) {
  return useLessonsWithProgress(unitId)
}

// Progress
export function useAppNextLesson() {
  return useNextLesson()
}

export function useAppCompleteLesson() {
  return useCompleteLesson()
}

export function useAppProgressSummary() {
  return useProgressSummary()
}

export function useAppUserProgress() {
  return useUserProgress()
}

// Additional hooks for lesson content and quiz
export function useAppLessonContent(lessonId: string) {
  // Return empty data for now - will be implemented later
  return { data: null, isLoading: false, error: null }
}

export function useAppQuizQuestions(lessonId: string) {
  return useQuizQuestions(lessonId)
}

export function useAppAlphabetLetters() {
  // Return empty data for now - will be implemented later
  return { data: [], isLoading: false, error: null }
}
