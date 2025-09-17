import type { Database, Lesson, LessonWithProgress, Unit, UnitWithLessons } from '@/types/supabase'
import type { LocalProgress } from '@/utils/local-storage'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import { localProgressStorage } from '@/utils/local-storage'

// Query keys
export const unitKeys = {
  all: ['units'] as const,
  units: () => [...unitKeys.all, 'list'] as const,
  unit: (id: string) => [...unitKeys.all, 'unit', id] as const,
  unitWithLessons: (id: string) => [...unitKeys.all, 'unit-with-lessons', id] as const,
  lessons: (unitId?: string) => [...unitKeys.all, 'lessons', unitId] as const,
  lesson: (id: string) => [...unitKeys.all, 'lesson', id] as const,
  userProgress: (userId: string) => [...unitKeys.all, 'user-progress', userId] as const,
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

// Get unit with lessons
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
            categories (name),
            user_progress!left (completed_at, score)
          )
        `
        )
        .eq('id', unitId)
        .single()

      if (error) throw error
      return data as UnitWithLessons
    },
    enabled: !!unitId,
  })
}

// Get lessons for a unit
export function useLessons(unitId?: string) {
  return useQuery({
    queryKey: unitKeys.lessons(unitId),
    queryFn: async (): Promise<Lesson[]> => {
      let query = supabase
        .from('lessons')
        .select(
          `
          *,
          units (title_en, title_fr),
          categories (name)
        `
        )
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
      const { data, error } = await supabase
        .from('lessons')
        .select(
          `
          *,
          units (title_en, title_fr),
          categories (name)
        `
        )
        .eq('id', lessonId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!lessonId,
  })
}

// Get user progress (local storage)
export function useUserProgress() {
  return useQuery({
    queryKey: unitKeys.userProgress('local'),
    queryFn: async (): Promise<LocalProgress[]> => {
      return await localProgressStorage.getAll()
    },
  })
}

// Get lessons with progress for a unit (using local storage)
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

      // Combine lessons with progress and determine if locked
      return (
        lessons?.map((lesson, index) => {
          const userProgress = progressMap.get(lesson.id)
          const isCompleted = !!userProgress?.completedAt

          // A lesson is locked if the previous lesson is not completed
          // First lesson is never locked
          const isLocked = index > 0 && !progressMap.get(lessons[index - 1].id)?.completedAt

          return {
            ...lesson,
            is_completed: isCompleted,
            is_locked: isLocked,
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

// Get the next lesson to continue (using local storage)
export function useNextLesson() {
  return useQuery({
    queryKey: [...unitKeys.all, 'next-lesson', 'local'],
    queryFn: async (): Promise<
      (Lesson & { units: { position: number; title_en: string; title_fr: string } }) | null
    > => {
      // Get all lessons ordered by unit position and lesson position
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select(
          `
          *,
          units (position, title_en, title_fr)
        `
        )
        .order('position', { ascending: true })

      if (lessonsError) throw lessonsError

      // Get local progress
      const localProgress = await localProgressStorage.getAll()
      const completedLessonIds = new Set(localProgress.map((p) => p.lessonId))

      // Find the first incomplete lesson
      const nextLesson = lessons?.find((lesson) => !completedLessonIds.has(lesson.id))

      return nextLesson || null
    },
  })
}

// Mark lesson as completed (using local storage)
export function useCompleteLesson() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ lessonId, score }: { lessonId: string; score?: number }) => {
      await localProgressStorage.saveLessonProgress(lessonId, score)
      return { lessonId, completedAt: new Date().toISOString(), score }
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: unitKeys.userProgress('local') })
      queryClient.invalidateQueries({ queryKey: unitKeys.all })
    },
  })
}

// Get progress summary (using local storage)
export function useProgressSummary() {
  return useQuery({
    queryKey: [...unitKeys.all, 'progress-summary', 'local'],
    queryFn: async () => {
      // Get total units and lessons
      const { data: units, error: unitsError } = await supabase
        .from('units')
        .select('id')
        .order('position', { ascending: true })

      if (unitsError) throw unitsError

      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('id, unit_id')
        .order('position', { ascending: true })

      if (lessonsError) throw lessonsError

      // Get local progress
      const localProgress = await localProgressStorage.getAll()
      const completedLessonIds = new Set(localProgress.map((p) => p.lessonId))
      const completedLessons = lessons?.filter((l) => completedLessonIds.has(l.id)) || []

      // Calculate completed units (a unit is completed if all its lessons are completed)
      const completedUnits =
        units?.filter((unit) => {
          const unitLessons = lessons?.filter((l) => l.unit_id === unit.id) || []
          return unitLessons.length > 0 && unitLessons.every((l) => completedLessonIds.has(l.id))
        }) || []

      return {
        totalUnits: units?.length || 0,
        completedUnits: completedUnits.length,
        totalLessons: lessons?.length || 0,
        completedLessons: completedLessons.length,
        progressPercentage: lessons?.length ? (completedLessons.length / lessons.length) * 100 : 0,
      }
    },
  })
}

// Quiz questions
export function useQuizQuestions(lessonId: string) {
  return useQuery({
    queryKey: [...unitKeys.lesson(lessonId), 'quiz'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data || []
    },
    enabled: !!lessonId,
  })
}
