# SPEC: an app-built "spot the letter" step for speakers

Status: approved (owner, 2026-11-14: "ok" to points 4–8). Follows `docs/archive/SPEC-path-step-order.md` (app #105), whose owner decision 5 named this follow-up. Stage 2 skipped: app step order, no data, auth or schema change. Verify: yes. iOS simulator check: yes.

## Why

On the speaker path a lesson leads with spelling. But 193 taught words have 2 or more Kabiyè-only letters and no `spell` or `spot_letter` paired to them on the speaker path. They sit in 112 of the 192 lesson files: 62 lessons have 1 such word, 33 have 2, 9 have 3, 6 have 4, 1 has 5 and 1 has 6 or more (measured on 2026-11-14 from the speaker step lists of #105). For those words a speaker gets no spelling practice at all.

The app can build the step itself. A `spot_letter` question needs only the right spelling: its wrong spellings come from `spellingVariants` (`mobile/src/utils/kabiye-variants.ts:70`), never from authored text (`mobile/src/types/activity-data.ts:118-134`). So no Kabiyè is invented and nothing is generated.

## Owner decisions (2026-11-14)

1. Speaker path only. A built step goes on a taught word with 2 or more of ɖ ɛ ɣ ɩ ŋ ɔ ʋ ñ (case-insensitive) and no `spell` or `spot_letter` paired to it. The step's right answer is the word as taught, and its wrong spellings come from `kabiye-variants`.
2. It goes right after the word's Teach card, before the word's paired activity.
3. At most 3 built steps per lesson. Take the words with the most special letters first. Break ties by teaching order.
4. A built step does not count as "practised" or as "spelled". The lesson summary counts the same words on every path, as #105 guarantees. A missed built step still goes to the review round like any other step.
5. Verifier and iOS simulator check: yes.

## The design

### Building the step

In `buildLessonSteps` (`mobile/src/utils/build-lesson-steps.ts`), for `path === 'speaker'` only:

1. After pairing (the existing `teach()`), list the taught words that qualify (decision 1). Count special letters with the same set the Teach card uses (`KABIYE_ONLY` in `mobile/src/components/lesson-steps/teach-content.tsx`). Move that set to one shared place in `mobile/src/utils/` and import it in both files: do not keep two copies.
2. Keep a word only when the built activity passes `isAnswerable` (`spellingVariants(correct, 2).length >= 2`). A word whose variants give fewer than 2 wrong spellings gets no step.
3. Sort the qualifying words by special-letter count (descending), then by teaching order. Take the first 3.
4. For each, build an `ActivityStep`:
   - `type: 'spot_letter'`
   - `id: 'built-spot-<word kbp>'`. Ids must be unique and stable: the session fingerprint hashes them.
   - `activity`: `{ id: 'built-spot-<word kbp>', activity_type: 'spot_letter', data: { correct: <word kbp>, gloss: { en, fr } } }`, with the gloss taken from the taught word's own `en`/`fr`. Set any other required `LessonActivity` field the type needs (position, lesson id) the way the builder already fills them for authored activities.
   - `wordKbp: <word kbp>`, so the review overlay ("Show the word again", `lesson.tsx`, finds its word through `wordKbp`) works.
   - `built: true`, a new optional field on `ActivityStep` (`mobile/src/types/lesson-steps.ts:63-81`). Document it: an app-built step, not lesson content. It never counts as practising a word.
5. Insert it right after the word's `teach-<kbp>` step, before the word's paired activity. Give every step its `order` from its final position, as the builder does now.

`null`, `'new'` and `'heritage'` build exactly the steps of #105, byte for byte, with the same fingerprints. Extend the pin test to say so for heritage too.

### Outcomes

- `practisedWords` (`mobile/src/utils/lesson-outcomes.ts:40`) skips a step with `built: true`. So the practised-word set is the same on every path.
- "Spelled correctly" (`answer()` in `mobile/src/utils/lesson-session.ts:165`) counts a correct `spell` only. A built step is a `spot_letter`, so nothing changes there. Check it and pin it in a test.
- The review round re-queues a missed step by its step id. A built step is missed and reviewed the same way as an authored one.

### Saved sessions

A speaker's saved session for a lesson that gains a built step has a new fingerprint. It is judged stale and the lesson restarts at the cover, once. This is the accepted behaviour of #105. Say so in the comment where the steps are built.

## Files to touch

| Path | Change |
|---|---|
| `mobile/src/utils/build-lesson-steps.ts` | Build, cap and insert the steps for speaker |
| `mobile/src/types/lesson-steps.ts` | `built?: boolean` on `ActivityStep`, with its comment |
| `mobile/src/utils/lesson-outcomes.ts` | `practisedWords` skips `built` steps |
| `mobile/src/utils/` (a new or existing letters module) | The shared Kabiyè-only letter set |
| `mobile/src/components/lesson-steps/teach-content.tsx` | Import the shared set |
| `mobile/src/utils/__tests__/build-lesson-steps.test.ts` and `build-lesson-steps-paths.test.ts` | The tests below. Update the paths test's oracle for speaker so its 400 seeded cases still pass. |

No new UI: the step renders with the existing `spot-letter-step.tsx`. No new strings.

## Edge cases

- A word with exactly 1 special letter: no step (C1-05-01's `kumoɖe` is the known case of a 1-letter `spot_letter`, and the schema rejects it).
- A word that already has a paired `spell` or `spot_letter`: no step.
- A word with 2 or more special letters but fewer than 2 variants: no step.
- The same word taught twice in a lesson: at most one built step, after its first Teach card.
- A lesson with 4 or more qualifying words: 3 steps, most special letters first.
- A word whose taught form has a capital letter (`Ɛ`, `Ɖ`): count it as special. Use the word as taught as the right answer.
- No path or `new`, or heritage: no built step.

## Tests

1. Speaker, a word with 2+ special letters and no spelling pairing: a `built-spot-<kbp>` step sits right after its Teach card and before its paired activity, with `built: true` and `wordKbp` set.
2. The cap: 4 qualifying words give 3 steps, the 3 with most special letters, ties by teaching order.
3. No step for a 1-letter word, for a word that already has a `spell` or `spot_letter`, or for a word with fewer than 2 variants.
4. `practisedWords` over the same answers gives the same words on speaker as on `null`, when a built step is answered.
5. A correct built step does not add to "spelled correctly".
6. `null`, `'new'` and `'heritage'`: steps and fingerprints as #105 (the pin test).
7. The paths test's 400 seeded cases pass with the speaker oracle updated.

## Done means

- The tests above pass. `pnpm exec jest`, `pnpm exec tsc --noEmit -p .` and eslint on the changed files pass.
- On all 192 kbp-content lesson files (`/Users/mrk/devs/kbp/kbp-content/storage/lessons/notebooklm-json`, copy to the scratchpad first): count the built steps per lesson (expected: 112 lessons gain 1 to 3, about 180 steps, never more than 3 in a lesson). Confirm `null`, `'new'` and `'heritage'` are unchanged, and that the practised-word sets are the same on every path. Put the counts in the PR.
- **The user-visible check, on an iOS simulator:** set Profile → "My path" to speaker. Open a lesson with a word that has 2 or more special letters and no authored spelling activity (the build names one from the counts). After that word's Teach card, a "Spot the letter" step asks for the word. A wrong answer sends it to the review round. The lesson summary's practised count is the same as on the "new" path for the same answers. With the path set to new, the step is not there.
- It merges into `develop`. It reaches testers only with the next app build (paid, the owner's yes per run).

## Out of scope

- A built `spell` step (typing the word). Speakers get recognition of the spelling only.
- Any change to lesson content or generation in kbp-content.
- Built steps for heritage or new.
