export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
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
      audios: {
        Row: {
          id: string
          storage_path: string
          name: string
          description: string | null
          tags: string[]
          duration_seconds: number | null
          mime_type: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          storage_path: string
          name: string
          description?: string | null
          tags: string[]
          duration_seconds?: number | null
          mime_type?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          storage_path?: string
          name?: string
          description?: string | null
          tags?: string[]
          duration_seconds?: number | null
          mime_type?: string | null
          created_at?: string | null
          updated_at?: string | null
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
            isOneToOne: false
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
      dictionary_entries: {
        Row: {
          created_at: string | null
          entry_data: Json
          headword: string
          id: string
          letter: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          entry_data: Json
          headword: string
          id?: string
          letter?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          entry_data?: Json
          headword?: string
          id?: string
          letter?: string | null
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
            isOneToOne: false
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
            isOneToOne: false
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
            isOneToOne: false
            referencedRelation: 'lessons'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lesson_topics_topic_id_fkey'
            columns: ['topic_id']
            isOneToOne: false
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
          status: Database['public']['Enums']['unit_status'] | null
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
          status?: Database['public']['Enums']['unit_status'] | null
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
          status?: Database['public']['Enums']['unit_status'] | null
          title_en?: string
          title_fr?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'lessons_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lessons_unit_id_fkey'
            columns: ['unit_id']
            isOneToOne: false
            referencedRelation: 'units'
            referencedColumns: ['id']
          },
        ]
      }
      reversal_index: {
        Row: {
          context_path: Json | null
          context_type: string
          entry_id: string | null
          id: string
          language: string
          reversal_term: string
          reversal_term_display: string
          search_vector: unknown
        }
        Insert: {
          context_path?: Json | null
          context_type: string
          entry_id?: string | null
          id?: string
          language: string
          reversal_term: string
          reversal_term_display: string
          search_vector?: unknown
        }
        Update: {
          context_path?: Json | null
          context_type?: string
          entry_id?: string | null
          id?: string
          language?: string
          reversal_term?: string
          reversal_term_display?: string
          search_vector?: unknown
        }
        Relationships: [
          {
            foreignKeyName: 'reversal_index_entry_id_fkey'
            columns: ['entry_id']
            isOneToOne: false
            referencedRelation: 'dictionary_entries'
            referencedColumns: ['id']
          },
        ]
      }
      searchable_headwords: {
        Row: {
          entry_id: string | null
          headword_term: string
          id: string
          is_primary: boolean | null
          parent_headword: string | null
          search_vector: unknown
          term_type: string
        }
        Insert: {
          entry_id?: string | null
          headword_term: string
          id?: string
          is_primary?: boolean | null
          parent_headword?: string | null
          search_vector?: unknown
          term_type: string
        }
        Update: {
          entry_id?: string | null
          headword_term?: string
          id?: string
          is_primary?: boolean | null
          parent_headword?: string | null
          search_vector?: unknown
          term_type?: string
        }
        Relationships: [
          {
            foreignKeyName: 'searchable_headwords_entry_id_fkey'
            columns: ['entry_id']
            isOneToOne: false
            referencedRelation: 'dictionary_entries'
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
      dictionary_statistics: {
        Row: {
          english_definitions: number | null
          french_definitions: number | null
          primary_headwords: number | null
          sub_entries: number | null
          total_entries: number | null
          total_letters: number | null
          variants: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_available_letters: {
        Args: never
        Returns: {
          entry_count: number
          letter: string
        }[]
      }
      get_entries_by_base_headword: {
        Args: { base_param: string }
        Returns: {
          entry_data: Json
          headword: string
          id: string
          letter: string
        }[]
      }
      get_entries_by_letter: {
        Args: {
          letter_param: string
          page_limit?: number
          page_offset?: number
        }
        Returns: {
          created_at: string
          entry_data: Json
          headword: string
          id: string
          updated_at: string
        }[]
      }
      get_entry_by_headword: {
        Args: { headword_param: string }
        Returns: {
          created_at: string
          entry_data: Json
          headword: string
          id: string
          letter: string
          updated_at: string
        }[]
      }
      get_entry_by_term: {
        Args: { term_param: string }
        Returns: {
          entry_data: Json
          headword: string
          id: string
          letter: string
          matched_term: string
          sub_entry_index: number
          term_type: string
        }[]
      }
      get_random_base_headwords: {
        Args: { base_count?: number }
        Returns: {
          base_headword: string
        }[]
      }
      get_random_entries: {
        Args: { entry_count?: number }
        Returns: {
          entry_data: Json
          headword: string
          id: string
        }[]
      }
      search_dictionary: {
        Args: {
          result_limit?: number
          search_language?: string
          search_query: string
        }
        Returns: {
          entry_data: Json
          headword: string
          id: string
          match_type: string
          rank: number
        }[]
      }
      update_headword_search_vectors: { Args: never; Returns: undefined }
      update_reversal_search_vectors: { Args: never; Returns: undefined }
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    keyof (DefaultSchema['Tables'] & DefaultSchema['Views']) | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      difficulty_level: ['beginner', 'intermediate', 'advanced'],
      unit_status: ['available', 'coming_soon', 'maintenance', 'disabled'],
    },
  },
} as const
