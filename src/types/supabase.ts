export interface Database {
  public: {
    Tables: {
      units: {
        Row: {
          id: string
          code: string
          title_en: string
          title_fr: string
          description_en: string | null
          description_fr: string | null
          position: number
          status: 'available' | 'coming_soon' | 'maintenance' | 'disabled'
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          title_en: string
          title_fr: string
          description_en?: string | null
          description_fr?: string | null
          position: number
          status?: 'available' | 'coming_soon' | 'maintenance' | 'disabled'
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          title_en?: string
          title_fr?: string
          description_en?: string | null
          description_fr?: string | null
          position?: number
          status?: 'available' | 'coming_soon' | 'maintenance' | 'disabled'
          created_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          name: string
          parent_category: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          parent_category?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          parent_category?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'categories_parent_category_fkey'
            columns: ['parent_category']
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
        ]
      }
      topics: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
        Relationships: []
      }
      lessons: {
        Row: {
          id: string
          unit_id: string
          category_id: string | null
          position: number
          title_en: string
          title_fr: string
          objectives_en: string[]
          objectives_fr: string[]
          difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
          created_at: string
        }
        Insert: {
          id?: string
          unit_id: string
          category_id?: string | null
          position: number
          title_en: string
          title_fr: string
          objectives_en: string[]
          objectives_fr: string[]
          difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
          created_at?: string
        }
        Update: {
          id?: string
          unit_id?: string
          category_id?: string | null
          position?: number
          title_en?: string
          title_fr?: string
          objectives_en?: string[]
          objectives_fr?: string[]
          difficulty?: 'Beginner' | 'Intermediate' | 'Advanced'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'lessons_unit_id_fkey'
            columns: ['unit_id']
            referencedRelation: 'units'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lessons_category_id_fkey'
            columns: ['category_id']
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
        ]
      }
      lesson_topics: {
        Row: {
          lesson_id: string
          topic_id: string
        }
        Insert: {
          lesson_id: string
          topic_id: string
        }
        Update: {
          lesson_id?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'lesson_topics_lesson_id_fkey'
            columns: ['lesson_id']
            referencedRelation: 'lessons'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lesson_topics_topic_id_fkey'
            columns: ['topic_id']
            referencedRelation: 'topics'
            referencedColumns: ['id']
          },
        ]
      }
      lesson_contents: {
        Row: {
          id: string
          lesson_id: string
          title_en: string
          title_fr: string
          content_en: string
          content_fr: string
          examples_en: any
          examples_fr: any
          image_url: string | null
          audio_url: string | null
          has_quiz: boolean
          created_at: string
        }
        Insert: {
          id?: string
          lesson_id: string
          title_en: string
          title_fr: string
          content_en: string
          content_fr: string
          examples_en?: any
          examples_fr?: any
          image_url?: string | null
          audio_url?: string | null
          has_quiz?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          lesson_id?: string
          title_en?: string
          title_fr?: string
          content_en?: string
          content_fr?: string
          examples_en?: any
          examples_fr?: any
          image_url?: string | null
          audio_url?: string | null
          has_quiz?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'lesson_contents_lesson_id_fkey'
            columns: ['lesson_id']
            referencedRelation: 'lessons'
            referencedColumns: ['id']
          },
        ]
      }
      quiz_questions: {
        Row: {
          id: string
          lesson_id: string
          question_type:
            | 'multiple-choice'
            | 'true-false'
            | 'fill-in-the-blank'
            | 'match-pairs'
            | 'order-words'
            | 'listen-type'
            | 'listen-chose'
          question_en: string
          question_fr: string
          options_en: any | null
          options_fr: any | null
          correct_answer: string
          audio_url: string | null
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          lesson_id: string
          question_type:
            | 'multiple-choice'
            | 'true-false'
            | 'fill-in-the-blank'
            | 'match-pairs'
            | 'order-words'
            | 'listen-type'
            | 'listen-chose'
          question_en: string
          question_fr: string
          options_en?: any | null
          options_fr?: any | null
          correct_answer: string
          audio_url?: string | null
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          lesson_id?: string
          question_type?:
            | 'multiple-choice'
            | 'true-false'
            | 'fill-in-the-blank'
            | 'match-pairs'
            | 'order-words'
            | 'listen-type'
            | 'listen-chose'
          question_en?: string
          question_fr?: string
          options_en?: any | null
          options_fr?: any | null
          correct_answer?: string
          audio_url?: string | null
          position?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'quiz_questions_lesson_id_fkey'
            columns: ['lesson_id']
            referencedRelation: 'lessons'
            referencedColumns: ['id']
          },
        ]
      }
      alphabet_letters: {
        Row: {
          id: string
          letter: string
          name: string
          type: 'vowel' | 'consonant' | 'grapheme'
          pronunciation_en: string
          pronunciation_fr: string
          description_en: string
          description_fr: string
          examples_en: any | null
          examples_fr: any | null
          audio_url: string | null
          image_url: string | null
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          letter: string
          name: string
          type: 'vowel' | 'consonant' | 'grapheme'
          pronunciation_en: string
          pronunciation_fr: string
          description_en: string
          description_fr: string
          examples_en?: any | null
          examples_fr?: any | null
          audio_url?: string | null
          image_url?: string | null
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          letter?: string
          name?: string
          type?: 'vowel' | 'consonant' | 'grapheme'
          pronunciation_en?: string
          pronunciation_fr?: string
          description_en?: string
          description_fr?: string
          examples_en?: any | null
          examples_fr?: any | null
          audio_url?: string | null
          image_url?: string | null
          position?: number
          created_at?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          lesson_id: string
          completed_at: string | null
          score: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          lesson_id: string
          completed_at?: string | null
          score?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          lesson_id?: string
          completed_at?: string | null
          score?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_progress_lesson_id_fkey'
            columns: ['lesson_id']
            referencedRelation: 'lessons'
            referencedColumns: ['id']
          },
        ]
      }
      cms_pages: {
        Row: {
          id: string
          slug: string
          title_en: string
          title_fr: string
          content_en: string
          content_fr: string
          description_en: string | null
          description_fr: string | null
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title_en: string
          title_fr: string
          content_en: string
          content_fr: string
          description_en?: string | null
          description_fr?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title_en?: string
          title_fr?: string
          content_en?: string
          content_fr?: string
          description_en?: string | null
          description_fr?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type Unit = Database['public']['Tables']['units']['Row']
export type Lesson = Database['public']['Tables']['lessons']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Topic = Database['public']['Tables']['topics']['Row']
export type LessonContent = Database['public']['Tables']['lesson_contents']['Row']
export type QuizQuestion = Database['public']['Tables']['quiz_questions']['Row']
export type AlphabetLetter = Database['public']['Tables']['alphabet_letters']['Row']
export type UserProgress = Database['public']['Tables']['user_progress']['Row']
export type CmsPage = Database['public']['Tables']['cms_pages']['Row']

// Extended types with relationships
export type UnitWithLessons = Unit & {
  lessons: Lesson[]
}

export type LessonWithContent = Lesson & {
  unit: Unit
  category: Category | null
  content: LessonContent | null
  quiz_questions: QuizQuestion[]
  user_progress: UserProgress | null
}

export type LessonWithProgress = Lesson & {
  is_completed: boolean
  is_locked: boolean
  progress: UserProgress | null
}
