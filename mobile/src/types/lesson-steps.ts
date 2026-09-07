// Lesson step types for the progressive lesson flow
import type { Json } from './db.types'
import type { LessonActivity } from './supabase'

/** Type guard: step has an activity (all activity-based steps including audio) */
export function hasActivity(step: LessonStep): step is ActivityStep {
  return 'activity' in step && step.activity != null
}

export type StepType =
  | 'content'
  | 'audio'
  | 'exercise'
  | 'quiz'
  | 'listen_choose'
  | 'listen_type'
  | 'match_pairs'
  | 'order_words'
  | 'fill_blank'
  | 'multiple_choice'
  | 'true_false'
  // Laterite added three. `spell` and `spot_letter` teach the orthography itself, which
  // is the whole product for one of the three audiences; `read_choose` is comprehension.
  | 'spell'
  | 'spot_letter'
  | 'read_choose'
  // The Laterite lesson opens on a cover naming the words it will teach, and gives each
  // word a screen of its own before asking anything about it.
  | 'cover'
  | 'teach'
  // The competency shape adds a dialogue set in a situation (after the cover) and
  // cultural notes (before the finish); the TDA rides on the finish screen.
  | 'dialogue'
  | 'notes'
  | 'completion'

/**
 * One word the lesson teaches.
 *
 * These come from `lesson_contents.examples`, which already carried everything except
 * `note_*` -- the short per-word explanation the Teach card shows. The Laterite lesson is
 * organised around this list: the cover promises it, each word gets a Teach card and a
 * question, and the finish counts it.
 */
export interface LessonExample {
  kbp: string
  en?: string
  fr?: string
  pronunciation?: string
  lexeme_id?: string
  /** Two or three sentences about this word, keyed by language.
   *  Optional: content written before the Laterite change has none. */
  note?: { en?: string; fr?: string }
  audio_url?: string
}

export interface BaseStep {
  id: string
  type: StepType
  order: number
}

export interface ActivityStep extends BaseStep {
  type:
    | 'audio'
    | 'listen_choose'
    | 'listen_type'
    | 'match_pairs'
    | 'order_words'
    | 'fill_blank'
    | 'multiple_choice'
    | 'true_false'
    | 'spell'
    | 'spot_letter'
    | 'read_choose'
  activity: LessonActivity
}

export interface ContentStep extends BaseStep {
  type: 'content'
  title?: string
  content: string
  examples?: Json | null // Raw examples from database, transformed in ContentStep component
}

export interface AudioStep extends BaseStep {
  type: 'audio'
  audioType: 'single' | 'conversation'
  audioUrl?: string
  conversation?: {
    speaker: string
    text: string
    audioUrl?: string
  }[]
  transcript?: string
}

export interface ExerciseStep extends BaseStep {
  type: 'exercise'
  exerciseType: 'listen_choose' | 'listen_type' | 'match_pairs' | 'order_words'
  title: string
  instructions?: string
  data: Json // Exercise-specific data
}

export interface QuizStep extends BaseStep {
  type: 'quiz'
  questionType: 'multiple_choice' | 'true_false' | 'fill_blank'
  question: string
  instructions?: string
  options: string[]
  correctAnswer: string
  explanation?: string
}

export interface ListenChooseStep extends BaseStep {
  type: 'listen_choose'
  question: string
  instructions?: string
  options: string[]
  correctAnswer: string
  audioUrl?: string
}

export interface MatchPairsStep extends BaseStep {
  type: 'match_pairs'
  question: string
  instructions?: string
  pairs: { left: string; right: string }[]
}

export interface OrderWordsStep extends BaseStep {
  type: 'order_words'
  question: string
  instructions?: string
  words: string[]
  correctOrder: string[]
}

export interface CoverStep extends BaseStep {
  type: 'cover'
  words: LessonExample[]
}

export interface TeachStepData extends BaseStep {
  type: 'teach'
  example: LessonExample
}

export interface DialogueStep extends BaseStep {
  type: 'dialogue'
  title: string
  scene?: string
  turns: LessonExample[]
}

export interface NotesStep extends BaseStep {
  type: 'notes'
  title: string
  content: string
}

export interface CompletionStep extends BaseStep {
  type: 'completion'
  score?: number
  totalQuestions?: number
  /** One sentence to go and do in a Kabiyè-speaking community this week. */
  tda?: string
}

export type LessonStep =
  | ContentStep
  | AudioStep
  | ExerciseStep
  | QuizStep
  | ListenChooseStep
  | MatchPairsStep
  | OrderWordsStep
  | ActivityStep
  | CoverStep
  | TeachStepData
  | DialogueStep
  | NotesStep
  | CompletionStep

export interface LessonProgress {
  currentStep: number
  totalSteps: number
  completedSteps: Set<number>
  answers: Map<string, unknown>
  score: number
}
