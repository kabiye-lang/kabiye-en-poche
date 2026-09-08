-- Browse by letter listed A and a as two separate tiles, and the same for C/c, Ɖ/ɖ,
-- Ŋ/ŋ and a dozen more -- 44 tiles for a 31-letter alphabet. The uppercase buckets are
-- not a different letter: they are the proper nouns and the proverbs the dictionary
-- records with a sentence-initial capital (Irakɩ, Japɔŋ, "Wɩsɩ ɛkpa sɛlɩ lɛ"). A learner
-- browsing for a word starting with i had to know to check two tiles, and the second
-- one held six entries.
--
-- The letter column keeps its case -- it is what the printed dictionary shows -- and the
-- fold happens where the alphabet is read.

create index if not exists idx_entries_letter_lower on public.dictionary_entries (lower(letter));

create or replace function public.get_available_letters()
returns table(letter character varying, entry_count bigint)
language plpgsql
stable
security invoker
set search_path = public
as $$
BEGIN
  RETURN QUERY
  SELECT
    lower(de.letter)::varchar AS letter,
    count(*) AS entry_count
  FROM dictionary_entries de
  WHERE de.letter IS NOT NULL
    -- Twenty-one entries are affixes rather than words (-baa, -ɖɛ, -kʋ, -ñɩnʋ) and were
    -- filed under a hyphen. The alphabet holds letters; they stay in the dictionary and
    -- stay findable by search, but a bare "-" at the head of the rail explains nothing.
    AND de.letter ~ '[[:alpha:]]'
  GROUP BY lower(de.letter)
  ORDER BY lower(de.letter);
END;
$$;

-- The defaults are part of the existing signature; dropping them is an error rather
-- than a replace.
create or replace function public.get_entries_by_letter(
  letter_param character varying,
  page_limit integer default 50,
  page_offset integer default 0
)
returns table(
  id uuid,
  headword text,
  entry_data jsonb,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
language plpgsql
stable
security invoker
set search_path = public
as $$
BEGIN
  RETURN QUERY
  SELECT
    de.id,
    de.headword,
    de.entry_data,
    de.created_at,
    de.updated_at
  FROM dictionary_entries de
  WHERE lower(de.letter) = lower(letter_param)
  ORDER BY de.headword
  LIMIT page_limit
  OFFSET page_offset;
END;
$$;
