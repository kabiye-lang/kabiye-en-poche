# SPEC: each lesson's steps follow the learner's path

Status: approved (owner "ok", 2026-11-13). The owner chose persona option A on 2026-11-13. Stage 2 skipped: app step order, no data, auth or schema change.

## Why

The onboarding asks one question: speaker, heritage or new (`mobile/src/hooks/use-path.ts:14`). Today the answer only reorders the first units (`PATH_UNIT_ORDER`, `use-path.ts:36-40`). Every lesson runs the same steps for all three. STATUS.md (kbp-content, lines ~491-493 and ~581) names the gap: "speaker = spelling-first bodies, heritage = recognition before production". This spec closes it in the app, from the lesson content that exists. Nothing is generated and no lesson is rewritten.

## Owner decisions (2026-11-13)

1. Option A: the app orders steps by path. Same content for all three paths.
2. Speaker: spelling comes first, on the Teach card and in the practice.
3. Heritage: reading recognition comes first, then production.
4. New, and a learner who tapped Skip (no stored path): no change.
5. A lesson with no spelling activity changes for a speaker only on the Teach card in this spec. An app-built `spot_letter` step for words with 2 or more special letters is a follow-up spec after this one ships (owner "ok" to point 17).

## The design

### The step builder takes a path

`buildLessonSteps` (`mobile/src/utils/build-lesson-steps.ts`) gets one new field, `path: LearnerPath | null`. `null` and `'new'` build exactly the steps of today, byte for byte, and the same `fingerprintLesson` hash. A test pins that.

Each activity type gets a rank per path. A lower rank comes first.

| Group | Types | speaker | heritage |
|---|---|---|---|
| Spelling | `spell`, `spot_letter` | 0 | 1 (`spot_letter`) / 2 (`spell`) |
| Recognition | `read_choose`, `match_pairs`, `multiple_choice` | 1 | 0 |
| Production | `fill_blank`, `order_words` | 1 | 2 |
| Other | `true_false`, audio types | 1 | 1 |

For heritage, `spot_letter` counts as recognition-adjacent: the learner picks the right spelling and does not produce it. `spell` and `fill_blank` are production.

### Speaker

1. **Pairing.** `teach()` pairs one activity to each word (`build-lesson-steps.ts`, the `paired` find). With a path, it takes the matching activity of lowest rank, not the first one in the list. Ties keep list order. A word that matches only one activity is paired as today.
2. **Unclaimed activities.** The activities no word claimed run after the sections, as today. For speaker they are sorted by rank, stable, so spelling ones come first.
3. **The Teach card leads with the spelling.** In `TeachContent` (`mobile/src/components/lesson-steps/teach-content.tsx`), the letter chips move up, between the gloss and the rule line. A label sits above them: "Letters to watch" / "Lettres à surveiller". The chips are already built from the word's own letters (`KABIYE_ONLY`, line ~8) and the alphabet table's pronunciation hint. No new text is generated. So kbp-content's `LETTER_REMARK_ALLOWANCE = 1` (`scripts/lessons/pedagogy.py:33`) stays as it is: the notes still talk about the word, and the screen talks about its letters.
4. A word with none of ɖ ɛ ɣ ɩ ŋ ɔ ʋ ñ shows no chips and no label. The card looks as it does today.
5. `TeachContent` takes an optional `leadWithLetters?: boolean`. The review overlay ("Show the word again", `lesson.tsx`) passes the same value, so the card looks the same both times.

### Heritage

1. **Pairing.** The same rank rule, with heritage ranks. A word that matches a recognition and a production activity is paired to the recognition one.
2. **Recognition before production, per section.** Inside each prose section, every word is taught with its recognition step first. A word whose only paired activity is production (`spell`, `fill_blank`, `order_words`) keeps its pairing (`wordKbp` stays set), but that step moves to after the section's last word and before the section's rule step. The moved steps keep their word order.
3. **Unclaimed activities.** Sorted by heritage rank, stable: recognition first.
4. The Teach card is unchanged.

### What does not move, for every path

- Cover, dialogue, cultural notes and completion with its TDA keep their places.
- The rule step stays at the end of its section.
- A listening question stays right after its word's paired activity, as today. It applies only once a recording exists.
- Words no section claims are still taught first.

### Honest outcomes

`wordKbp` is set by pairing, never by position (`docs/archive/SPEC-honest-outcomes.md`, "Pairing (explicit, not adjacency)"). A heritage production step that moves after its section keeps its `wordKbp`. So "practised" counts the same words for every path. "Spelled correctly" stays a correct `spell` answer only. `spot_letter` never counts as spelled, on any path.

### Saved sessions

`fingerprintLesson` (`mobile/src/utils/lesson-session.ts:95`) hashes step ids and order. A learner who changes path in Profile mid-lesson gets a different step list. The stored session is then judged stale and dropped, and the lesson restarts at the cover. This is acceptable: it is how a content change already behaves. Say so in a comment where `path` is read.

## Interface

```ts
buildLessonSteps({
  lessonId, contents, activities, words, sectionOf, getValue, audioFor,
  path, // LearnerPath | null
}): LessonStep[]
```

`mobile/src/screens/lesson.tsx` reads `usePath()` and passes `path`. The steps wait for `isLoading` to be false, the same way they wait for content and audio (`contentReady`, `lesson.tsx` ~line 117), or a stored session would be built for the wrong path and then dropped.

## Files to touch

| Path | Change |
|---|---|
| `mobile/src/utils/build-lesson-steps.ts` | `path` field, the rank table, path-aware pairing, heritage per-section deferral, the stable sort of unclaimed activities |
| `mobile/src/screens/lesson.tsx` | Read `usePath()`, pass `path`, wait for it in `contentReady`, pass `leadWithLetters` to both `TeachContent` uses |
| `mobile/src/components/lesson-steps/teach-step.tsx` | Pass `leadWithLetters` through |
| `mobile/src/components/lesson-steps/teach-content.tsx` | `leadWithLetters` prop: the chips and their label move above the note |
| `mobile/src/locales/en/messages.po`, `mobile/src/locales/fr/messages.po` | "Letters to watch" / "Lettres à surveiller" (run the Lingui extract the project uses) |
| `mobile/src/utils/__tests__/build-lesson-steps.test.ts` | The tests below |
| `mobile/src/hooks/use-path.ts` | Only the comment at line ~11 ("the only personalisation") and the onboarding comment at `app/(onboarding)/index.tsx:26-27` ("only reorders units", and "can be changed from Learn", which is wrong: it is Profile) |

Copy the existing patterns: `seededShuffle` stays the only shuffle (no randomness from the path), and the rank sort is a stable `[...list].sort`, as `orderUnitsForPath` does (`use-path.ts:48-58`).

## Edge cases

- A lesson with no `spell` or `spot_letter`: speaker gets the same steps as new, plus the card lead.
- A lesson whose activities are all one type: every path gets today's order.
- A word with no paired activity: unchanged on every path.
- A heritage section where every paired activity is production: all of them move after the section's words, so the section reads teach, teach, teach, then the practice.
- A legacy lesson with no sections (all words unclaimed by a section): the heritage deferral applies to that group of words as one section.
- `spot_letter` that `isAnswerable` rejects is dropped before ranking, as today.
- Dialogue, cultural notes and TDA: unchanged on every path.
- The learner switches language: no effect on order.

## Build steps

1. Measure on the 189 lesson files in kbp-content `storage/lessons/notebooklm-json` (copy them to the scratchpad first, reading the folder in place was slow): how many taught words match more than one activity, how many have a spelling activity, how many a recognition one. Put the counts in the PR. If almost no word matches more than one activity, the pairing change does little, and the effect comes from the card lead, the unclaimed sort and the heritage deferral. Say so.
2. Build the builder change with its tests.
3. Build the card lead.
4. Run the app in an iOS simulator with a lesson that has spelling activities and special-letter words (the build picks one, for example from A1-01 Writing & Sound). Set each path from Profile → "My path".

## Tests

Unit tests in `build-lesson-steps.test.ts`, on one fixture lesson with 2 sections, 4 words (2 with special letters), and activities of each group, some paired and 2 unclaimed:

1. `null` and `'new'` give exactly today's steps and today's fingerprint (pin against the current output).
2. Speaker: a word that matches a `match_pairs` and a `spell` is paired to `spell`. Unclaimed activities: `spell`/`spot_letter` first.
3. Heritage: a word that matches `read_choose` and `spell` is paired to `read_choose`. A word paired only to `fill_blank` has that step after the section's last teach and before the rule step, with `wordKbp` set.
4. Every path: `practisedWords` over the same answers gives the same words.
5. Cover, dialogue, notes and completion keep their positions on every path.

A component test for `TeachContent`: with `leadWithLetters`, the label and chips render before the note. For a word without special letters, there is no label.

## Done means

- The 5 builder tests and the component test pass. The existing tests pass. `npm test` (or the project's test command) passes in `mobile/`.
- Lint and typecheck pass.
- **The user-visible check, on an iOS simulator:** in one lesson with a spelling activity, a speaker sees "Letters to watch" on the Teach card and a spelling step before any matching step. With the path set to heritage, the same lesson shows a reading-recognition step (`read_choose`, `match_pairs` or `multiple_choice`) first, and its production steps after the section's words. With the path set to new, the lesson is the same as before the change.
- The PR states the counts from build step 1.
- It merges into `develop`. It reaches testers only with the next app build. An EAS build is paid and needs the owner's yes for that run.

## Out of scope

- New activity types, or activities built by the app from a word. A speaker who meets a word with no spelling activity gets none added. (See the owner question in the handoff.)
- Any change to lesson generation in kbp-content.
- Recognition by ear. That needs recordings, which the audio work brings.
