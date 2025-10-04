export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.5'
  }
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
      lesson_activities: {
        Row: {
          activity_type: string
          created_at: string | null
          data: Json
          id: string
          instructions_en: string | null
          instructions_fr: string | null
          lesson_id: string
          position: number
          question_en: string | null
          question_fr: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          data?: Json
          id?: string
          instructions_en?: string | null
          instructions_fr?: string | null
          lesson_id: string
          position?: number
          question_en?: string | null
          question_fr?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          data?: Json
          id?: string
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
            referencedRelation: 'lessons'
            referencedColumns: ['id']
          },
        ]
      }
      lesson_contents: {
        Row: {
          content_en: string
          content_fr: string
          created_at: string | null
          examples: Json | null
          id: string
          lesson_id: string
          position: number | null
          title_en: string
          title_fr: string
        }
        Insert: {
          content_en: string
          content_fr: string
          created_at?: string | null
          examples?: Json | null
          id?: string
          lesson_id: string
          position?: number | null
          title_en: string
          title_fr: string
        }
        Update: {
          content_en?: string
          content_fr?: string
          created_at?: string | null
          examples?: Json | null
          id?: string
          lesson_id?: string
          position?: number | null
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
          difficulty: Database['public']['Enums']['difficulty_level']
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
          difficulty: Database['public']['Enums']['difficulty_level']
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
          difficulty?: Database['public']['Enums']['difficulty_level']
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
          status: Database['public']['Enums']['unit_status'] | null
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
          status?: Database['public']['Enums']['unit_status'] | null
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
          status?: Database['public']['Enums']['unit_status'] | null
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
      difficulty_level: 'beginner' | 'intermediate' | 'advanced'
      unit_status: 'available' | 'coming_soon' | 'maintenance' | 'disabled'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Lesson = Tables<'lessons'>
export type Unit = Tables<'units'>
export type LessonContent = Tables<'lesson_contents'>
export type LessonActivity = Tables<'lesson_activities'>
export type Category = Tables<'categories'>
export type Topic = Tables<'topics'>
export type AlphabetLetter = Tables<'alphabet_letters'>
export type CmsPage = Tables<'cms_pages'>
export type DifficultyLevel = Database['public']['Enums']['difficulty_level']
export type UnitStatus = Database['public']['Enums']['unit_status']

// Example type for the unified structure
export interface Example {
  kbp: string
  en: string
  fr: string
  pronunciation?: string
  audio_url?: string
}

// Extended types with relationships
export type UnitWithLessons = Unit & {
  lessons: Lesson[]
}

export type LessonWithContent = Lesson & {
  unit: Unit
  category: Category | null
  contents: LessonContent[]
  activities: LessonActivity[]
}

export type LessonWithProgress = Lesson & {
  is_completed: boolean
  is_locked: boolean
  progress_percentage: number
}
