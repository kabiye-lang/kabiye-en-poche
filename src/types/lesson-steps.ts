// Lesson step types for the progressive lesson flow

export type StepType =
  | 'content'
  | 'audio'
  | 'exercise'
  | 'quiz'
  | 'listen_choose'
  | 'match_pairs'
  | 'order_words'
  | 'completion'

export interface BaseStep {
  id: string
  type: StepType
  order: number
}

export interface ContentStep extends BaseStep {
  type: 'content'
  content: string
  examples?: {
    kabiye: string
    translation: string
  }[]
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
  data: any // Exercise-specific data
}

export interface QuizStep extends BaseStep {
  type: 'quiz'
  questionType: 'multiple_choice' | 'true_false' | 'fill_blank'
  question: string
  options: string[]
  correctAnswer: string
  explanation?: string
}

export interface ListenChooseStep extends BaseStep {
  type: 'listen_choose'
  question: string
  options: string[]
  correctAnswer: string
  audioUrl?: string
}

export interface MatchPairsStep extends BaseStep {
  type: 'match_pairs'
  question: string
  pairs: { left: string; right: string }[]
}

export interface OrderWordsStep extends BaseStep {
  type: 'order_words'
  question: string
  words: string[]
  correctOrder: string[]
}

export interface CompletionStep extends BaseStep {
  type: 'completion'
  score?: number
  totalQuestions?: number
}

export type LessonStep =
  | ContentStep
  | AudioStep
  | ExerciseStep
  | QuizStep
  | ListenChooseStep
  | MatchPairsStep
  | OrderWordsStep
  | CompletionStep

export interface LessonProgress {
  currentStep: number
  totalSteps: number
  completedSteps: Set<number>
  answers: Map<string, any>
  score: number
}
