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
import { lockStates, nextLesson } from '../utils/lesson-locks'
import { isWritten } from '../utils/lesson-status'
import { localProgressStorage } from '../utils/local-storage'
import { orderUnitsForPath, usePath } from './use-path'

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

// Get every lesson on the path, with local progress -- one query instead of one per
// unit, so Learn can partition without waterfalling a fetch per chapter.
export function usePathLessons() {
  return useQuery({
    queryKey: [...unitKeys.all, 'lessons', 'with-progress', 'local', 'path'],
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
        .order('position', { ascending: true })

      if (lessonsError) throw lessonsError

      const localProgress = await localProgressStorage.getAll()
      const progressMap = new Map(localProgress.map((p) => [p.lessonId, p]))
      const completed = new Set(localProgress.filter((p) => p.completedAt).map((p) => p.lessonId))

      // Locks are computed one unit at a time -- lockStates walks a single unit's
      // lessons in position order, the same shape useLessonsWithProgress feeds it.
      const byUnit = new Map<string, typeof lessons>()
      for (const lesson of lessons ?? []) {
        const list = byUnit.get(lesson.unit_id) ?? []
        list.push(lesson)
        byUnit.set(lesson.unit_id, list)
      }
      const lockedById = new Map<string, boolean>()
      for (const unitLessons of byUnit.values()) {
        const sorted = [...unitLessons].sort((a, b) => a.position - b.position)
        const locks = lockStates(sorted, completed)
        sorted.forEach((lesson, i) => lockedById.set(lesson.id, locks[i]))
      }

      return (
        lessons?.map((lesson) => {
          const userProgress = progressMap.get(lesson.id)
          const isCompleted = !!userProgress?.completedAt

          return {
            ...lesson,
            is_completed: isCompleted,
            is_locked: lockedById.get(lesson.id) ?? false,
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

/** Where to resume: the lesson, its unit's title (both languages, for the caller to
 *  resolve), and where it sits among the unit's written lessons. */
export interface NextLessonSummary {
  lesson: Lesson
  unitTitle: { title_en: string; title_fr: string }
  ordinal: number
  writtenInUnit: number
}

// Get next lesson to continue
export function useNextLesson() {
  // The path is part of the key: a new path is a new question, answered fresh, with no
  // invalidation to remember. Until the stored path has been read there is no answer to
  // give -- a lesson from the default order would only be replaced a moment later.
  const { path, isLoading } = usePath()
  return useQuery({
    queryKey: ['next-lesson', path],
    enabled: !isLoading,
    queryFn: async (): Promise<NextLessonSummary | null> => {
      // 235 lessons is one small request; picking the next one here, in the learner's unit
      // order, keeps Home's "continue" card and Learn's ink card on the same lesson.
      const [unitsResult, lessonsResult, completedIds] = await Promise.all([
        supabase.from('units').select('*').order('position', { ascending: true }),
        supabase.from('lessons').select('*').order('position', { ascending: true }),
        localProgressStorage.getCompletedLessonIds(),
      ])
      if (unitsResult.error) throw unitsResult.error
      if (lessonsResult.error) throw lessonsResult.error

      const ordered = orderUnitsForPath(unitsResult.data ?? [], path)
      const found = nextLesson(ordered, lessonsResult.data ?? [], new Set(completedIds))
      if (!found) return null

      return {
        lesson: found.lesson,
        unitTitle: { title_en: found.unit.title_en, title_fr: found.unit.title_fr },
        ordinal: found.ordinal,
        writtenInUnit: found.writtenInUnit,
      }
    },
  })
}

// Get progress summary
export function useProgressSummary() {
  return useQuery({
    queryKey: ['progress-summary'],
    queryFn: async () => {
      const completedLessonIds = await localProgressStorage.getCompletedLessonIds()

      const { data: units, error: unitsError } = await supabase.from('units').select('id, status')
      if (unitsError) throw unitsError
      const writtenUnits = (units ?? []).filter((unit) => isWritten(unit.status))

      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('id, unit_id, status')
        .in(
          'unit_id',
          writtenUnits.map((u) => u.id)
        )
      if (lessonsError) throw lessonsError
      const writtenLessons = (lessons ?? []).filter((lesson) => isWritten(lesson.status))

      // Every lesson on the map, written or not. The five-level map holds all of them as
      // rows, so the count comes from the table rather than a constant that goes stale.
      const { count: plannedLessons, error: plannedError } = await supabase
        .from('lessons')
        .select('id', { count: 'exact', head: true })
      if (plannedError) throw plannedError

      const totalUnits = writtenUnits.length
      const totalLessons = writtenLessons.length
      const completedLessons = completedLessonIds.length

      // Calculate completed units (units where all lessons are completed)
      const completedUnits = writtenUnits.filter((unit) => {
        const unitLessons = writtenLessons.filter((lesson) => lesson.unit_id === unit.id)
        return unitLessons.every((lesson) => completedLessonIds.includes(lesson.id))
      }).length

      const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0

      return {
        totalUnits,
        totalLessons,
        plannedLessons: plannedLessons ?? totalLessons,
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
