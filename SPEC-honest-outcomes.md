# SPEC — Honest learning outcomes

Source: `../design_handoff_laterite/IMPLEMENTATION-REVIEW.md` §1 (plus the §5 claim about generation). Order: 2 of 5. Tokens from `SPEC-laterite-a11y-foundations.md` (use `text-accent-text` etc. if landed; otherwise keep existing classes).

Revision 2 — folds in the Codex spec review (2026-09-21). Rejected findings at the end.

## Goal

Finish, Profile, My words and the website state only what the app measured. Nothing claims a learner "can read", "can write" or "has written" a word.

## Definitions (single source)

- **Saved** — any entry in My words (AsyncStorage `MY_WORDS_KEY`). Arrives two ways: finishing a lesson (`lesson.tsx` `addMet`) **or bookmarking in the dictionary** (`screens/dictionary/word.tsx:252` also calls `addMet`). Because bookmarks land here too, Profile's total is **"words saved"**, never "met". No data migration.
- **Practised (this lesson)** — a taught word whose explicitly paired activity step (see *Pairing*) has an answer in `answers`, under its own id or `retry-{id}`, right or wrong. Distinct by `kbp`.
- **Met (this lesson)** — taught in this lesson but not practised.
- **Spelled correctly** — `writtenCount > 0` (unchanged `markWritten`, only on a correct `spell` answer). `SPEC-finite-review-and-resume.md` later excludes supported attempts.

## Pairing (explicit, not adjacency)

- `mobile/src/types/lesson-steps.ts`: add optional `wordKbp?: string` to `ActivityStep`.
- `mobile/src/screens/lesson.tsx` `teach()` (~L243-262): when an activity is paired to a word, set `wordKbp: word.kbp` on the pushed step. Unpaired leftover activities (~L287-295) get none.
- Move `INTERACTIVE_STEPS` / `isInteractive` from `lesson.tsx` to `mobile/src/utils/lesson-outcomes.ts` and export them; `lesson.tsx` imports them. One predicate, one place.
- Legacy lessons whose activities are unpaired therefore produce no practised words — they are "met". Say so in a comment.

## Changes — mobile

1. **`mobile/src/utils/lesson-outcomes.ts`** — `practisedWords(steps: readonly LessonStep[], answers: ReadonlyMap<string, unknown>): string[]` returning distinct `kbp`s in lesson order: every interactive step with `wordKbp` whose id or `retry-` id is in `answers`. Style after `utils/section-kinds.ts`.
2. **`lesson.tsx`** — `practised = words.filter(w => practisedSet.has(w.kbp))`, `metOnly = words.filter(w => !practisedSet.has(w.kbp))`; pass both to `FinishStep`.
3. **`components/lesson-steps/finish-step.tsx`**
   - Props `practised: LessonExample[]`, `metOnly: LessonExample[]` replace `words`.
   - Headline: practised non-empty → "You practised {n} words." / "You practised one word."; else "You met {n} words." / "You met one word."
   - List: practised rows; then, only if both groups are non-empty, a section label "Words you met" and the metOnly rows (same row style).
   - "Saved to My words · {n} so far" stays but shows only after the save resolved successfully (see 4); on failure show nothing (the lesson still finishes).
   - Rewrite the doc comment ("What you can now read…").
   - Retry sentence unchanged here (owned by spec 3).
4. **`mobile/src/hooks/use-my-words.ts`**
   - **Serialize every mutation** through one module-level promise chain (`let queue = Promise.resolve(); const enqueue = (fn) => (queue = queue.then(fn, fn))`) so `addMet` and `markWritten` can never read-modify-write over each other. Each mutation reads storage inside the queued function.
   - Rename `readCount` → `savedCount` (doc: "Entries in My words — lesson words and dictionary bookmarks"); `writtenCount` doc: "Words spelled correctly at least once". Update every caller (grep).
   - `lesson.tsx`: capture the `addMet` promise result and pass `savedTotal` only after it resolves (state), so Finish never claims a save that failed.
5. **`screens/profile.tsx`** ~L141-155: "word saved" / "words saved"; "word spelled correctly" / "words spelled correctly". Update the block comment.
6. **`screens/dictionary/my-words.tsx`**:
   - a11y label ~L93: `written` → "spelled correctly"; `not written yet` → "not spelled yet".
   - ~L124: "Practise the {n} unwritten" → "Practise the {n} not spelled yet" (one: "Practise the 1 not spelled yet").
   - Legend line (added by spec 1): "Filled pencil: spelled correctly at least once."
   - Update code comments that define the state as "has written".
7. **Catalogs** — `pnpm -C mobile i18n:extract`; French by hand:
   | EN | FR |
   |---|---|
   | You practised {n} words. / You practised one word. | Vous avez pratiqué {n} mots. / Vous avez pratiqué un mot. |
   | You met {n} words. / You met one word. | Vous avez découvert {n} mots. / Vous avez découvert un mot. |
   | Words you met | Mots découverts |
   | word saved / words saved | mot enregistré / mots enregistrés |
   | word spelled correctly / words spelled correctly | mot bien écrit / mots bien écrits |
   | spelled correctly / not spelled yet | bien écrit / pas encore écrit |
   | Practise the 1 not spelled yet / Practise the {n} not spelled yet | S'entraîner sur le mot pas encore écrit / S'entraîner sur les {n} mots pas encore écrits |
   | Filled pencil: spelled correctly at least once. | Crayon plein : bien écrit au moins une fois. |
   Reuse the existing FR name for "My words" from the catalog. List every msgid `--clean` removed.

## Changes — website (`website/src/pages/Home.tsx`)

- L78 EN → "Every lesson teaches a handful of words. Each is shown and explained letter by letter, then you try it in a short activity. Mistakes come back at the end. There is no score — just the words you practised, each linking to its dictionary entry."
- L167 FR → "Chaque leçon enseigne une poignée de mots. Chacun est montré et expliqué lettre par lettre, puis vous l'essayez dans une courte activité. Les erreurs reviennent à la fin. Il n'y a pas de score — seulement les mots que vous avez pratiqués, chacun renvoyant à son entrée du dictionnaire."
- L80 EN: replace the first two sentences with "Words and examples are checked against dictionary sources." — keep the audio sentence.
- L169 FR: "Les mots et les exemples sont vérifiés dans les sources du dictionnaire." + the audio sentence.
- No Kabiyè words added or changed.

## Done means

- [ ] `mobile/src/utils/__tests__/lesson-outcomes.test.ts`: (a) recognition-only paired steps → words practised; (b) answer only under `retry-{id}` → practised; (c) same step answered and retried → counted once; (d) same `kbp` taught twice → once; (e) teach followed by a non-interactive step → not practised; (f) unpaired legacy activity answered → no word; (g) empty answers → none.
- [ ] `mobile/src/hooks/__tests__/use-my-words.test.ts` (mock AsyncStorage with a deliberately slow `getItem`): `addMet` and `markWritten` fired without awaiting → final stored value contains both the new words and the incremented `writtenCount`.
- [ ] `pnpm -C mobile exec tsc --noEmit`, `pnpm -C mobile exec eslint .`, `pnpm -C mobile test`, `pnpm -C website build`, `pnpm -C website lint:check` (added in spec 1; if absent, `pnpm -C website exec eslint .`) exit 0; `git status` clean of gate-made changes.
- [ ] `grep -rniE "can now read|you can read|you can write|lire et écrire|savez (lire|écrire)|nothing is generated|rien n'est inventé|unwritten|not written yet|then you spell it" mobile/src website/src` → no user-facing match (code comments reviewed by hand).
- [ ] Every new msgid has a non-empty French msgstr different from the English.
- [ ] Simulator (argent), EN and FR, three lessons or fixtures: all-practised (headline N = number of rows); mixed (headline N = practised rows; total rows = practised + met); zero-practised ("You met N words", no sub-label). Profile shows "words saved" and "words spelled correctly", matching My words.

## Review findings rejected

None rejected. Finding 1 resolved by the simpler option (label the total "saved") rather than splitting the stored model.
