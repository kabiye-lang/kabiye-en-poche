import { lockStates } from '../utils/lesson-locks'
import type {
  AlphabetLetter,
  CmsPage,
  Lesson,
  LessonActivity,
  LessonWithProgress,
  Unit,
  UnitWithLessons,
} from '../types/supabase'
import type { LocalProgress } from '../utils/local-storage'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '../lib/supabase'
import { localProgressStorage } from '../utils/local-storage'

// Query keys
export const unitKeys = {
  all: ['units'] as const,
  units: () => [...unitKeys.all, 'list'] as const,
  unit: (id: string) => [...unitKeys.all, 'unit', id] as const,
  unitWithLessons: (id: string) => [...unitKeys.all, 'unit-with-lessons', id] as const,
  lessons: (unitId?: string) => [...unitKeys.all, 'lessons', unitId] as const,
  lesson: (id: string) => [...unitKeys.all, 'lesson', id] as const,
  userProgress: (userId: string) => [...unitKeys.all, 'user-progress', userId] as const,
  alphabetLetters: () => [...unitKeys.all, 'alphabet-letters'] as const,
  alphabetLetter: (id: string) => [...unitKeys.all, 'alphabet-letter', id] as const,
  cmsPages: () => [...unitKeys.all, 'cms-pages'] as const,
  cmsPage: (slug: string) => [...unitKeys.all, 'cms-page', slug] as const,
}

// Get all units
export function useUnits() {
  return useQuery({
    queryKey: unitKeys.units(),
    queryFn: async (): Promise<Unit[]> => {
      const { data, error } = await supabase.from('units').select('*').order('position', { ascending: true })

      if (error) throw error
      return data || []
    },
  })
}

// Get a single unit
export function useUnit(unitId: string) {
  return useQuery({
    queryKey: unitKeys.unit(unitId),
    queryFn: async (): Promise<Unit | null> => {
      const { data, error } = await supabase.from('units').select('*').eq('id', unitId).single()

      if (error) throw error
      return data
    },
    enabled: !!unitId,
  })
}

// Get a unit with its lessons
export function useUnitWithLessons(unitId: string) {
  return useQuery({
    queryKey: unitKeys.unitWithLessons(unitId),
    queryFn: async (): Promise<UnitWithLessons | null> => {
      const { data, error } = await supabase
        .from('units')
        .select(
          `
          *,
          lessons (
            *,
            user_progress (
              is_completed,
              completed_at
            )
          )
        `
        )
        .eq('id', unitId)
        .single()

      if (error) throw error
      return data as unknown as UnitWithLessons
    },
    enabled: !!unitId,
  })
}

// Get all lessons (optionally filtered by unit) - only available lessons
export function useLessons(unitId?: string) {
  return useQuery({
    queryKey: unitKeys.lessons(unitId),
    queryFn: async (): Promise<Lesson[]> => {
      let query = supabase
        .from('lessons')
        .select('*')
        .or('status.eq.available,status.is.null')
        .order('position', { ascending: true })

      if (unitId) {
        query = query.eq('unit_id', unitId)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    },
  })
}

// Get a single lesson
export function useLesson(lessonId: string) {
  return useQuery({
    queryKey: unitKeys.lesson(lessonId),
    queryFn: async (): Promise<Lesson | null> => {
      const { data, error } = await supabase.from('lessons').select('*').eq('id', lessonId).single()

      if (error) throw error
      return data
    },
    enabled: !!lessonId,
  })
}

// Get lessons with progress for a specific unit
export function useLessonsWithProgress(unitId: string) {
  return useQuery({
    queryKey: [...unitKeys.lessons(unitId), 'with-progress', 'local'],
    queryFn: async (): Promise<LessonWithProgress[]> => {
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select(
          `
          *,
          units (title_en, title_fr),
          categories (name)
        `
        )
        .eq('unit_id', unitId)
        .order('position', { ascending: true })

      if (lessonsError) throw lessonsError

      // Get local progress
      const localProgress = await localProgressStorage.getAll()
      const progressMap = new Map(localProgress.map((p) => [p.lessonId, p]))

      // Combine lessons with progress and determine if locked. An unbuilt lesson
      // cannot gate the built one after it -- see lesson-locks.ts.
      const completed = new Set(localProgress.filter((p) => p.completedAt).map((p) => p.lessonId))
      const locks = lockStates(lessons ?? [], completed)
      return (
        lessons?.map((lesson, index) => {
          const userProgress = progressMap.get(lesson.id)
          const isCompleted = !!userProgress?.completedAt
          const isLocked = locks[index]

          return {
            ...lesson,
            is_completed: isCompleted,
            is_locked: isLocked,
            progress_percentage: isCompleted ? 100 : 0,
            progress: userProgress
              ? {
                  id: userProgress.lessonId,
                  user_id: 'local',
                  lesson_id: userProgress.lessonId,
                  completed_at: userProgress.completedAt,
                  score: userProgress.score ?? null,
                  created_at: userProgress.completedAt,
                  updated_at: userProgress.completedAt,
                }
              : null,
          }
        }) || []
      )
    },
    enabled: !!unitId,
  })
}

// Get user progress
export function useUserProgress() {
  return useQuery({
    queryKey: unitKeys.userProgress('local'),
    queryFn: async (): Promise<LocalProgress[]> => {
      return await localProgressStorage.getAll()
    },
  })
}

// Get next lesson to continue
export function useNextLesson() {
  return useQuery({
    queryKey: ['next-lesson'],
    queryFn: async () => {
      const completedLessonIds = await localProgressStorage.getCompletedLessonIds()

      if (!completedLessonIds.length) {
        // If no lessons completed, get the first lesson of the first unit
        const { data: firstUnit } = await supabase
          .from('units')
          .select('id')
          .eq('status', 'available')
          .order('position', { ascending: true })
          .limit(1)
          .single()

        if (firstUnit) {
          const { data: firstLesson } = await supabase
            .from('lessons')
            .select('*')
            .eq('unit_id', firstUnit.id)
            .or('status.eq.available,status.is.null')
            .order('position', { ascending: true })
            .limit(1)
            .single()

          return firstLesson
        }
        return null
      }

      // Find the next incomplete lesson
      const lastCompletedLessonId = completedLessonIds[completedLessonIds.length - 1]

      const { data: lastLesson } = await supabase
        .from('lessons')
        .select('unit_id, position')
        .eq('id', lastCompletedLessonId)
        .single()

      if (lastLesson) {
        const { data: nextLesson } = await supabase
          .from('lessons')
          .select('*')
          .eq('unit_id', lastLesson.unit_id)
          .gt('position', lastLesson.position)
          .or('status.eq.available,status.is.null')
          .order('position', { ascending: true })
          .limit(1)
          .single()

        if (nextLesson) {
          return nextLesson
        }

        // If no more lessons in current unit, get first lesson of next unit
        const { data: nextUnit } = await supabase
          .from('units')
          .select('id')
          .eq('status', 'available')
          .gt('position', lastLesson.unit_id)
          .order('position', { ascending: true })
          .limit(1)
          .single()

        if (nextUnit) {
          const { data: firstLessonOfNextUnit } = await supabase
            .from('lessons')
            .select('*')
            .eq('unit_id', nextUnit.id)
            .or('status.eq.available,status.is.null')
            .order('position', { ascending: true })
            .limit(1)
            .single()

          return firstLessonOfNextUnit
        }
      }

      return null
    },
  })
}

// Get progress summary
export function useProgressSummary() {
  return useQuery({
    queryKey: ['progress-summary'],
    queryFn: async () => {
      const completedLessonIds = await localProgressStorage.getCompletedLessonIds()

      const { data: units } = await supabase.from('units').select('id').eq('status', 'available')

      const { data: lessons } = await supabase
        .from('lessons')
        .select('id, unit_id')
        .in('unit_id', units?.map((u) => u.id) || [])
        .or('status.eq.available,status.is.null')

      const totalUnits = units?.length || 0
      const totalLessons = lessons?.length || 0
      const completedLessons = completedLessonIds.length

      // Calculate completed units (units where all lessons are completed)
      const completedUnits =
        units?.filter((unit) => {
          const unitLessons = lessons?.filter((lesson) => lesson.unit_id === unit.id) || []
          return unitLessons.every((lesson) => completedLessonIds.includes(lesson.id))
        }).length || 0

      const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0

      return {
        totalUnits,
        totalLessons,
        completedUnits,
        completedLessons,
        progressPercentage,
      }
    },
  })
}

// Complete a lesson
export function useCompleteLesson() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (lessonId: string) => {
      await localProgressStorage.saveLessonProgress(lessonId)
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: unitKeys.all })
      queryClient.invalidateQueries({ queryKey: ['next-lesson'] })
      queryClient.invalidateQueries({ queryKey: ['progress-summary'] })
    },
  })
}

// Reset all progress
export function useResetProgress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await localProgressStorage.clearAll()
    },
    onSuccess: () => {
      // Invalidate all related queries to refresh UI
      queryClient.invalidateQueries({ queryKey: unitKeys.all })
      queryClient.invalidateQueries({ queryKey: ['next-lesson'] })
      queryClient.invalidateQueries({ queryKey: ['progress-summary'] })
    },
  })
}

// Get lesson content (DEPRECATED: use useLessonContents instead)
export function useLessonContent(lessonId: string) {
  return useQuery({
    queryKey: ['lesson-content', lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lesson_contents')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('position', { ascending: true })
        .limit(1)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!lessonId,
  })
}

// Get all lesson contents (supports multiple content sections per lesson)
export function useLessonContents(lessonId: string) {
  return useQuery({
    queryKey: ['lesson-contents', lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lesson_contents')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('position', { ascending: true })

      if (error) throw error
      return data || []
    },
    enabled: !!lessonId,
  })
}

// REMOVED: useLessonExercises and useQuizQuestions
// Both have been consolidated into useLessonActivities below

// Get all lesson activities (unified quiz questions and exercises)
export function useLessonActivities(lessonId: string) {
  return useQuery({
    queryKey: ['lesson-activities', lessonId],
    queryFn: async (): Promise<LessonActivity[]> => {
      const { data, error } = await supabase
        .from('lesson_activities')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('position', { ascending: true })

      if (error) throw error
      return data || []
    },
    enabled: !!lessonId,
  })
}

// Get all alphabet letters
export function useAlphabetLetters() {
  return useQuery({
    queryKey: unitKeys.alphabetLetters(),
    queryFn: async (): Promise<AlphabetLetter[]> => {
      const { data, error } = await supabase.from('alphabet_letters').select('*').order('position', { ascending: true })

      if (error) throw error
      return data || []
    },
  })
}

// Get a single alphabet letter
export function useAlphabetLetter(letterId: string) {
  return useQuery({
    queryKey: unitKeys.alphabetLetter(letterId),
    queryFn: async (): Promise<AlphabetLetter | null> => {
      const { data, error } = await supabase.from('alphabet_letters').select('*').eq('id', letterId).single()

      if (error) throw error
      return data
    },
    enabled: !!letterId,
  })
}

// Get all CMS pages
export function useCmsPages() {
  return useQuery({
    queryKey: unitKeys.cmsPages(),
    queryFn: async (): Promise<CmsPage[]> => {
      const { data, error } = await supabase
        .from('cms_pages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error) throw error
      return data || []
    },
  })
}

// Get a single CMS page by slug
export function useCmsPage(slug: string) {
  return useQuery({
    queryKey: unitKeys.cmsPage(slug),
    queryFn: async (): Promise<CmsPage | null> => {
      const { data, error } = await supabase
        .from('cms_pages')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!slug,
  })
}
