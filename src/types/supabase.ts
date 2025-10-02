export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      alphabet_letters: {
        Row: {
          audio_url: string | null
          created_at: string | null
          description_en: string
          description_fr: string
          examples_en: Json | null
          examples_fr: Json | null
          id: string
          image_url: string | null
          position: number
          pronunciation_en: string | null
          pronunciation_fr: string | null
          type: string | null
        }
        Insert: {
          audio_url?: string | null
          created_at?: string | null
          description_en: string
          description_fr: string
          examples_en?: Json | null
          examples_fr?: Json | null
          id: string
          image_url?: string | null
          position: number
          pronunciation_en?: string | null
          pronunciation_fr?: string | null
          type?: string | null
        }
        Update: {
          audio_url?: string | null
          created_at?: string | null
          description_en?: string
          description_fr?: string
          examples_en?: Json | null
          examples_fr?: Json | null
          id?: string
          image_url?: string | null
          position?: number
          pronunciation_en?: string | null
          pronunciation_fr?: string | null
          type?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
          parent_category: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          parent_category?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          parent_category?: string | null
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
      cms_pages: {
        Row: {
          content_en: string
          content_fr: string
          created_at: string | null
          description_en: string | null
          description_fr: string | null
          id: string
          is_active: boolean | null
          slug: string
          sort_order: number | null
          title_en: string
          title_fr: string
          updated_at: string | null
        }
        Insert: {
          content_en: string
          content_fr: string
          created_at?: string | null
          description_en?: string | null
          description_fr?: string | null
          id?: string
          is_active?: boolean | null
          slug: string
          sort_order?: number | null
          title_en: string
          title_fr: string
          updated_at?: string | null
        }
        Update: {
          content_en?: string
          content_fr?: string
          created_at?: string | null
          description_en?: string | null
          description_fr?: string | null
          id?: string
          is_active?: boolean | null
          slug?: string
          sort_order?: number | null
          title_en?: string
          title_fr?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      lesson_contents: {
        Row: {
          audio_url: string | null
          content_en: string
          content_fr: string
          created_at: string | null
          examples_en: Json | null
          examples_fr: Json | null
          has_quiz: boolean | null
          id: string
          image_url: string | null
          lesson_id: string
          title_en: string
          title_fr: string
        }
        Insert: {
          audio_url?: string | null
          content_en: string
          content_fr: string
          created_at?: string | null
          examples_en?: Json | null
          examples_fr?: Json | null
          has_quiz?: boolean | null
          id?: string
          image_url?: string | null
          lesson_id: string
          title_en: string
          title_fr: string
        }
        Update: {
          audio_url?: string | null
          content_en?: string
          content_fr?: string
          created_at?: string | null
          examples_en?: Json | null
          examples_fr?: Json | null
          has_quiz?: boolean | null
          id?: string
          image_url?: string | null
          lesson_id?: string
          title_en?: string
          title_fr?: string
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
      lesson_exercises: {
        Row: {
          audio_url: string | null
          created_at: string | null
          data: Json
          exercise_type: string
          id: string
          instructions_en: string | null
          instructions_fr: string | null
          lesson_id: string
          position: number
          title_en: string
          title_fr: string
        }
        Insert: {
          audio_url?: string | null
          created_at?: string | null
          data: Json
          exercise_type: string
          id?: string
          instructions_en?: string | null
          instructions_fr?: string | null
          lesson_id: string
          position?: number
          title_en: string
          title_fr: string
        }
        Update: {
          audio_url?: string | null
          created_at?: string | null
          data?: Json
          exercise_type?: string
          id?: string
          instructions_en?: string | null
          instructions_fr?: string | null
          lesson_id?: string
          position?: number
          title_en?: string
          title_fr?: string
        }
        Relationships: [
          {
            foreignKeyName: 'lesson_exercises_lesson_id_fkey'
            columns: ['lesson_id']
            referencedRelation: 'lessons'
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
      lessons: {
        Row: {
          category_id: string | null
          created_at: string | null
          difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
          id: string
          objectives_en: string[] | null
          objectives_fr: string[] | null
          position: number
          title_en: string
          title_fr: string
          unit_id: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
          id?: string
          objectives_en?: string[] | null
          objectives_fr?: string[] | null
          position: number
          title_en: string
          title_fr: string
          unit_id: string
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          difficulty?: 'Beginner' | 'Intermediate' | 'Advanced'
          id?: string
          objectives_en?: string[] | null
          objectives_fr?: string[] | null
          position?: number
          title_en?: string
          title_fr?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'lessons_category_id_fkey'
            columns: ['category_id']
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lessons_unit_id_fkey'
            columns: ['unit_id']
            referencedRelation: 'units'
            referencedColumns: ['id']
          },
        ]
      }
      lesson_activities: {
        Row: {
          activity_type: string
          audio_url: string | null
          created_at: string | null
          data: Json
          id: string
          image_url: string | null
          instructions_en: string | null
          instructions_fr: string | null
          lesson_id: string
          position: number
          question_en: string | null
          question_fr: string | null
        }
        Insert: {
          activity_type: string
          audio_url?: string | null
          created_at?: string | null
          data?: Json
          id?: string
          image_url?: string | null
          instructions_en?: string | null
          instructions_fr?: string | null
          lesson_id: string
          position?: number
          question_en?: string | null
          question_fr?: string | null
        }
        Update: {
          activity_type?: string
          audio_url?: string | null
          created_at?: string | null
          data?: Json
          id?: string
          image_url?: string | null
          instructions_en?: string | null
          instructions_fr?: string | null
          lesson_id?: string
          position?: number
          question_en?: string | null
          question_fr?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'lesson_activities_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'lessons'
            referencedColumns: ['id']
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_answer: string
          created_at: string | null
          explanation_en: string | null
          explanation_fr: string | null
          id: string
          lesson_id: string
          options: Json
          position: number
          question_en: string
          question_fr: string
          question_type: string
        }
        Insert: {
          correct_answer: string
          created_at?: string | null
          explanation_en?: string | null
          explanation_fr?: string | null
          id?: string
          lesson_id: string
          options: Json
          position?: number
          question_en: string
          question_fr: string
          question_type: string
        }
        Update: {
          correct_answer?: string
          created_at?: string | null
          explanation_en?: string | null
          explanation_fr?: string | null
          id?: string
          lesson_id?: string
          options?: Json
          position?: number
          question_en?: string
          question_fr?: string
          question_type?: string
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
      topics: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      units: {
        Row: {
          code: string
          created_at: string | null
          description_en: string | null
          description_fr: string | null
          id: string
          position: number
          status: 'available' | 'coming_soon' | 'maintenance' | 'disabled' | null
          title_en: string
          title_fr: string
        }
        Insert: {
          code: string
          created_at?: string | null
          description_en?: string | null
          description_fr?: string | null
          id?: string
          position: number
          status?: 'available' | 'coming_soon' | 'maintenance' | 'disabled' | null
          title_en: string
          title_fr: string
        }
        Update: {
          code?: string
          created_at?: string | null
          description_en?: string | null
          description_fr?: string | null
          id?: string
          position?: number
          status?: 'available' | 'coming_soon' | 'maintenance' | 'disabled' | null
          title_en?: string
          title_fr?: string
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

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Insertables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updateables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Specific table types
export type Unit = Tables<'units'>
export type Lesson = Tables<'lessons'>
export type LessonContent = Tables<'lesson_contents'>
export type LessonActivity = Tables<'lesson_activities'>
export type LessonExercise = Tables<'lesson_exercises'>
export type QuizQuestion = Tables<'quiz_questions'>
export type Category = Tables<'categories'>
export type Topic = Tables<'topics'>
export type AlphabetLetter = Tables<'alphabet_letters'>
export type CmsPage = Tables<'cms_pages'>

// Extended types with relationships
export type UnitWithLessons = Unit & {
  lessons: Lesson[]
}

export type LessonWithContent = Lesson & {
  unit: Unit
  category: Category | null
  content: LessonContent | null
  quiz_questions: QuizQuestion[]
  exercises: LessonExercise[]
}

export type LessonWithProgress = Lesson & {
  is_completed: boolean
  is_locked: boolean
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

export type UserProgress = {
  id: string
  user_id: string
  lesson_id: string
  is_completed: boolean
  completed_at: string
  score: number | null
  created_at: string
  updated_at: string
}
