-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.alphabet_letters (
  id text NOT NULL,
  description_en text NOT NULL,
  description_fr text NOT NULL,
  examples_en jsonb,
  examples_fr jsonb,
  audio_url text,
  image_url text,
  position integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  type text CHECK (type = ANY (ARRAY['vowel'::text, 'consonant'::text, 'grapheme'::text])),
  pronunciation_en text,
  pronunciation_fr text,
  CONSTRAINT alphabet_letters_pkey PRIMARY KEY (id)
);
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  parent_category uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_parent_category_fkey FOREIGN KEY (parent_category) REFERENCES public.categories(id)
);
CREATE TABLE public.cms_pages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  slug text NOT NULL UNIQUE,
  title_en text NOT NULL,
  title_fr text NOT NULL,
  content_en text NOT NULL,
  content_fr text NOT NULL,
  description_en text,
  description_fr text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cms_pages_pkey PRIMARY KEY (id)
);
CREATE TABLE public.dictionary_entries (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  headword text NOT NULL,
  letter character varying,
  entry_data jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT dictionary_entries_pkey PRIMARY KEY (id)
);
CREATE TABLE public.lesson_activities (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  lesson_id uuid NOT NULL,
  position integer NOT NULL DEFAULT 1,
  activity_type text NOT NULL CHECK (activity_type = ANY (ARRAY['multiple_choice'::text, 'true_false'::text, 'fill_blank'::text, 'match_pairs'::text, 'order_words'::text, 'listen_choose'::text, 'listen_type'::text])),
  question_en text,
  question_fr text,
  instructions_en text,
  instructions_fr text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT lesson_activities_pkey PRIMARY KEY (id),
  CONSTRAINT lesson_activities_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id)
);
CREATE TABLE public.lesson_contents (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  lesson_id uuid NOT NULL,
  title_en text NOT NULL,
  title_fr text NOT NULL,
  content_en text NOT NULL,
  content_fr text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  position integer DEFAULT 0,
  examples jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT lesson_contents_pkey PRIMARY KEY (id),
  CONSTRAINT lesson_contents_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id)
);
CREATE TABLE public.lesson_topics (
  lesson_id uuid NOT NULL,
  topic_id uuid NOT NULL,
  CONSTRAINT lesson_topics_pkey PRIMARY KEY (lesson_id, topic_id),
  CONSTRAINT lesson_topics_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id),
  CONSTRAINT lesson_topics_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES public.topics(id)
);
CREATE TABLE public.lessons (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  unit_id uuid NOT NULL,
  category_id uuid,
  position integer NOT NULL,
  title_en text NOT NULL,
  title_fr text NOT NULL,
  objectives_en ARRAY,
  objectives_fr ARRAY,
  created_at timestamp with time zone DEFAULT now(),
  difficulty USER-DEFINED NOT NULL,
  CONSTRAINT lessons_pkey PRIMARY KEY (id),
  CONSTRAINT lessons_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id),
  CONSTRAINT lessons_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.reversal_index (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  entry_id uuid,
  reversal_term text NOT NULL,
  reversal_term_display text NOT NULL,
  language character varying NOT NULL CHECK (language::text = ANY (ARRAY['fr'::character varying, 'en'::character varying]::text[])),
  context_type character varying NOT NULL,
  context_path jsonb,
  search_vector tsvector,
  CONSTRAINT reversal_index_pkey PRIMARY KEY (id),
  CONSTRAINT reversal_index_entry_id_fkey FOREIGN KEY (entry_id) REFERENCES public.dictionary_entries(id)
);
CREATE TABLE public.searchable_headwords (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  entry_id uuid,
  headword_term text NOT NULL,
  term_type character varying NOT NULL,
  is_primary boolean DEFAULT false,
  parent_headword text,
  search_vector tsvector,
  CONSTRAINT searchable_headwords_pkey PRIMARY KEY (id),
  CONSTRAINT searchable_headwords_entry_id_fkey FOREIGN KEY (entry_id) REFERENCES public.dictionary_entries(id)
);
CREATE TABLE public.topics (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT topics_pkey PRIMARY KEY (id)
);
CREATE TABLE public.units (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  code text NOT NULL UNIQUE,
  title_en text NOT NULL,
  title_fr text NOT NULL,
  description_en text,
  description_fr text,
  position integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  status USER-DEFINED DEFAULT 'available'::unit_status,
  CONSTRAINT units_pkey PRIMARY KEY (id)
);