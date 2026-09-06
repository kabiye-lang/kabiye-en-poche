-- NOT APPLIED. Needs a human to run it (agent DB writes were blocked this session).
--
-- The app already ignores these values at runtime (mobile/src/utils/audio-source.ts),
-- so nothing is broken while this is pending. Running it removes the dead data so the
-- database stops claiming audio that does not exist.

begin;

-- 1. Placeholder audio -----------------------------------------------------------
-- 251 of 253 example recordings pointed at one stock piano clip; the other two are
-- dead links (one .mp4 typo, one storage object that 404s). No audio anywhere works.

update lesson_contents
set examples = (
  select jsonb_agg(e - 'audio_url' order by ord)
  from jsonb_array_elements(examples) with ordinality as t(e, ord)
)
where examples is not null
  and jsonb_typeof(examples) = 'array'
  and examples::text like '%audio_url%';

update lesson_activities
set data = data - 'audioUrl' - 'audio_url'
where data ?| array['audioUrl', 'audio_url'];

-- 2. French left in English-language fields ---------------------------------------
-- Two of 103 activities. The rest of the en/fr pairs that share a quoted token share
-- it correctly, because the token is a Kabiye word or letter.

update lesson_activities
set data = jsonb_set(data, '{sentence_en}', '"In Kabiyè, ''salt'' is translated as ___."')
where data->>'sentence_en' = 'In Kabiyè, ''sel'' is translated as ___.';

update lesson_activities
set question_en = 'Arrange the words: ''You and me.'''
where question_en = 'Arrange the words: ''Toi et moi.''';

-- 3. A Kabiye word spelled with `n` where the language uses `ŋ` ----------------
-- Found by the validator's new interface-copy check, 2026-09-06. `taŋga` is attested;
-- `tanga` is not. It sits in prose, which the Kabiye field walker never visited.

update lesson_activities
set question_en = replace(question_en, 'tanga', 'taŋga'),
    question_fr = replace(question_fr, 'tanga', 'taŋga')
where question_en like '%tanga%' or question_fr like '%tanga%';

update lesson_contents
set content_en = replace(content_en, 'tanga', 'taŋga'),
    content_fr = replace(content_fr, 'tanga', 'taŋga')
where content_en like '%tanga%' or content_fr like '%tanga%';

commit;
