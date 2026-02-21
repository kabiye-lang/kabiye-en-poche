/**
 * Re-exports database types from db.types.ts (auto-generated from DB schema)
 * and defines app-specific type aliases.
 *
 * When the database changes, regenerate db.types.ts - this file stays stable.
 */

export type { Json, Database, Tables, TablesInsert, TablesUpdate, Enums, CompositeTypes } from './db.types'

export { Constants } from './db.types'

/** Row types for tables */
export type AlphabetLetter = import('./db.types').Tables<'alphabet_letters'>
export type CmsPage = import('./db.types').Tables<'cms_pages'>
export type Lesson = import('./db.types').Tables<'lessons'>
export type LessonActivity = import('./db.types').Tables<'lesson_activities'>
export type Unit = import('./db.types').Tables<'units'>

/** Lesson with progress (from useLessonsWithProgress) */
export interface LessonWithProgress extends Lesson {
  is_completed: boolean
  is_locked: boolean
  progress_percentage: number
  progress: {
    id: string
    user_id: string
    lesson_id: string
    completed_at: string
    score: number | null
    created_at: string
    updated_at: string
  } | null
}

/** Unit with nested lessons (from useUnitWithLessons) */
export interface UnitWithLessons extends Unit {
  lessons: (Lesson & {
    user_progress: { is_completed: boolean; completed_at: string | null }[] | null
  })[]
}

/** Difficulty level enum (beginner | intermediate | advanced) */
export type DifficultyLevel = import('./db.types').Database['public']['Enums']['difficulty_level']
