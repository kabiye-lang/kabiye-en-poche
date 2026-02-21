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

/** Quiz (multiple_choice / true_false) */
export interface QuizActivityData {
  options?: Record<string, string[]>
  correct_answer?: string | Record<string, string>
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

/** Match pairs - right side can be localized */
export interface MatchPairItem {
  left: string
  right: string | Record<string, string>
}

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
