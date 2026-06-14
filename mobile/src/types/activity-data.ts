/**
 * Typed activity data per activity_type.
 * lesson_activities.data is Json from Supabase; these types describe the known shapes.
 */

export interface AudioConversationLine {
  speaker: string
  text: string
  audioUrl?: string
}

/** Audio activity: single or conversation with transcript */
export interface AudioActivityData {
  audioType?: 'single' | 'conversation'
  audioUrl?: string
  conversation?: AudioConversationLine[]
  conversation_en?: AudioConversationLine[]
  conversation_fr?: AudioConversationLine[]
  transcript?: string
  transcript_en?: string
  transcript_fr?: string
}

/** Quiz (multiple_choice / true_false) - options/answer can be in UI language (en/fr) or Kabiyè (kbp) */
export interface QuizActivityData {
  /** Options keyed by language: en, fr, or kbp. For true_false, omit – built-in True/False used. */
  options?: Record<string, string[]>
  /** Correct answer. For multiple_choice: string or keyed. For true_false: use answer instead. */
  correct_answer?: string | Record<string, string>
  /** For true_false only: the correct answer (true or false) */
  answer?: boolean
  /** Optional explanation (always in UI language en/fr) */
  explanation?: Record<string, string>
}

/** Fill blank */
export interface FillBlankActivityData {
  sentence?: Record<string, string>
  sentence_en?: string
  sentence_fr?: string
  answer?: string
  options?: string[]
}

/** Listen and choose */
export interface ListenChooseActivityData {
  audio_url?: string
  options?: string[]
  correct_answer?: string
  translation?: Record<string, string>
  translation_en?: string
  translation_fr?: string
}

/** Listen and type */
export interface ListenTypeActivityData {
  audio_url?: string
  correct_answer?: string
  hints?: string[]
  translation?: Record<string, string>
  translation_en?: string
  translation_fr?: string
}

/** Match pairs - legacy: left/right structure */
export interface MatchPairItemLeftRight {
  left: string
  right: string | Record<string, string>
}

/** Match pairs - DB format: en/fr/kbp per pair (left=kbp, right=translation) */
export interface MatchPairItemLang {
  en?: string
  fr?: string
  kbp?: string
}

export type MatchPairItem = MatchPairItemLeftRight | MatchPairItemLang

export interface MatchPairsActivityData {
  pairs?: MatchPairItem[]
}

/** Order words */
export interface OrderWordsActivityData {
  words?: string[]
  correct_order?: string[]
}

/** Union of all activity data shapes */
export type ActivityData =
  | AudioActivityData
  | QuizActivityData
  | FillBlankActivityData
  | ListenChooseActivityData
  | ListenTypeActivityData
  | MatchPairsActivityData
  | OrderWordsActivityData
