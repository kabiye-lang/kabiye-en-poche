# SPEC — Finite review stage and lesson resume

Source: `../design_handoff_laterite/IMPLEMENTATION-REVIEW.md` §2 (and the "supported ≠ independent" rule in §1). Order: 3 of 5.

**Prerequisite gate:** `SPEC-honest-outcomes.md` is merged into this branch's base (its `wordKbp` on activity steps, `utils/lesson-outcomes.ts`, serialized `use-my-words.ts`, `savedCount`). Do not start otherwise.

Revision 2 — folds in the Codex spec review (2026-09-21). Rejected findings at the end.

## Goal

A lesson has a fixed length. Missed items come back once, in a separately announced **Review** stage whose list is frozen when it starts. A second miss ends in the answer being shown and explained and the word staying in My words. Leaving and reopening a lesson returns to the same step with the same **submitted** answers and review state. Answers given after "Show the word again" are **supported** and never shown or counted as independent success.

**Guarantee boundary:** only submitted answers (those passed to `onAnswer`) are persisted. A half-typed spelling or an option selected but not continued is not restored; the step reopens blank. This is deliberate.

## 1. State model — `mobile/src/utils/lesson-session.ts` (pure)

```ts
type Phase = 'lesson' | 'review' | 'finish'
interface LessonSession {
  v: 1
  fingerprint: string          // see 3
  phase: Phase
  lessonIndex: number          // index into `steps` (fixed lesson, incl. cover, excl. completion)
  reviewStepIds: string[]      // frozen on entering review; ids of original steps
  reviewIndex: number
  answers: Record<string, { answer: string; isCorrect: boolean; supported: boolean }>  // keys: step id or `retry-{id}`
  shown: string[]              // retry ids where "Show the word again" was opened
}
type Effect = { kind: 'markWritten'; headword: string } | { kind: 'addMet' } | { kind: 'announceReview' }
```

Transitions return `{ state, effects }`:
- `advance(state, steps)` — lesson phase: next index; on passing the last lesson step, if any interactive step answered wrong (original id, not supported) → `phase: 'review'`, `reviewStepIds` = those ids in lesson order, `reviewIndex: 0`, effect `announceReview`; else `phase: 'finish'`. Review phase: next `reviewIndex`, past the end → `finish`. Entering `finish` emits `addMet` exactly once.
- `answer(state, step, answer, isCorrect)` — records under the current id (`retry-{id}` in review). `supported = shown.includes(id)`. Emits `markWritten` only when `step.type === 'spell' && isCorrect && !supported`. Idempotent: a second call for an already-answered id is ignored (double tap).
- `showWord(state)` — review phase only; adds current retry id to `shown`.
- Invariants (checked by `decode`): `phase` valid; `0 ≤ lessonIndex < lessonStepCount`; `reviewStepIds` unique, each an existing interactive step id, all answered wrong in lesson phase; `0 ≤ reviewIndex ≤ reviewStepIds.length`; `review` phase ⇒ `reviewStepIds.length > 0`; answer keys are known ids or `retry-` + a `reviewStepIds` member; `shown ⊆ retry ids`.
- `decode(json, steps, fingerprint): LessonSession | null` — runtime-validates shape and invariants; any failure or fingerprint mismatch ⇒ `null`.
- `progressView(state, steps)` → `{ kind: 'lesson', current, total } | { kind: 'review', current, total, isStart } | { kind: 'finish', total }`, `total` for lesson = number of lesson steps (never grows).
- `reviewOutcomes(state, steps)` → `{ word, outcome: 'right' | 'helped' | 'missed' }[]`, one per `reviewStepIds` entry **whose step has `wordKbp`**, deduped by word (worst outcome wins: missed > helped > right). Review items without `wordKbp` are still asked but not named on Finish.

`walkedSteps` / `missed` / `retriesQueued` in `lesson.tsx` are replaced by this model. The retry step rendered in review is the original step object with id `retry-{id}` (as today).

## 2. Persistence — `mobile/src/hooks/use-lesson-session.ts`

- Key `lesson-session:v1:{lessonId}`. Hydrate once after `steps` exist; render the existing skeleton until hydration resolves; **no write happens before hydration completes**.
- Writes: one serialized chain per key; each write carries a monotonically increasing revision and a write is skipped if a newer revision is already queued (latest wins). Copy the queue style introduced in `use-my-words.ts` by spec 2.
- Flush on `AppState` → `background`/`inactive` and on the close button (await the pending write before `router.back()`, max 300ms). Hard kill during an in-flight native write is not guaranteed; say so in a comment.
- Corrupt/invalid/mismatched snapshot → `removeItem`, start fresh. Storage errors → keep working in memory; log via one module-level `warnedOnce` flag.
- Export `readLessonSessionSummary(lessonId): Promise<{ kind: 'lesson', current, total } | { kind: 'review' } | null>` for Home (spec 4) — non-throwing, validates the same way but without steps (bounds against stored lengths only).
- Completion (`handleLessonComplete`): after the mutation succeeds, `await removeItem`; if removal fails, still navigate and log. Check `useCompleteLesson` in `mobile/src/hooks/` is idempotent (upsert or "already completed" safe); if not, make it so. "Back to path" from Finish keeps the session (reopen → Finish).

## 3. Fingerprint

`fingerprint = hash(JSON.stringify(steps.map(s => [s.id, s.type, 'activity' in s ? s.activity.data : null, s.type === 'teach' ? s.example.kbp : null])))` with a small stable string hash (djb2 or FNV-1a) in `lesson-session.ts`. Any change to ids, order, or activity data (answers, options, prompts) invalidates the stored session.

## 4. Progress bar — `components/lesson-steps/progress-bar.tsx`

Takes `view` from `progressView` instead of `currentStep/totalSteps`.
- lesson: segments over lesson steps; counter `{current}/{total}`; a11y "Step {current} of {total}".
- review: segments over review items; counter **"Review · {current} of {total}"**; a11y "Review, {current} of {total}".
- finish: lesson bar full.
- On `announceReview`, `lesson.tsx` calls `AccessibilityInfo.announceForAccessibility(t\`Review. Words you missed, one more time.\`)`. The first review step (`isStart`) shows the eyebrow "Review" + "Words you missed, one more time." — only when `isStart`.

## 5. Miss feedback in review — every interactive step

Components: `spell-step`, `quiz-step`, `fill-blank-step`, `read-choose-step`, `spot-letter-step`, `order-words-step`, `listen-choose-step`, `listen-type-step`, `match-pairs-step`. Each gets `isReview?: boolean`.
- Extract `components/lesson-steps/miss-note.tsx` rendering the closing line: lesson → "We'll ask this one again at the end." (existing msgid); review → "It stays in My words to practise." Replace the inline strings at `spell-step.tsx:113`, `fill-blank-step.tsx:147`, `read-choose-step.tsx:116`, `quiz-step.tsx:149`, `order-words-step.tsx:141`, and the tail of `spot-letter-step.tsx:147` (split that sentence so the answer part stays).
- Every miss states the right answer in text. Where the step has no authored explanation, use "The answer is {answer}." `listen-choose-step.tsx` currently only highlights — add the text. Audit `match-pairs` and `listen-type`; add the line if missing.

## 6. "Show the word again" (review, steps with `wordKbp` only)

- Extract the presentational part of `TeachStep` into `components/lesson-steps/teach-content.tsx` (word, gloss, note, audio if a real recording exists — never substituted, no missing-audio explanation). `TeachStep` uses it; its "Try it"/"Look it up" controls stay in `TeachStep` only.
- In `lesson.tsx`, review steps render a text button "Show the word again" (≥ 44pt) above the step. Pressing it dispatches `showWord` and renders an overlay **sibling** above the still-mounted step: `TeachContent` + one button "Back to the question". While open: the step container gets `importantForAccessibility="no-hide-descendants"` / `accessibilityElementsHidden`, the overlay `accessibilityViewIsModal`, focus moves to the overlay heading, Android `BackHandler` closes the overlay (not the lesson). Input in the step is preserved because it never unmounts.

## 7. Finish copy — `finish-step.tsx`

Prop `review: { word: string; outcome: 'right' | 'helped' | 'missed' }[]` replaces `retried`. Render non-empty groups in this order:
| outcome | one | many |
|---|---|---|
| right | "{word} came back for a second try. You got it." | "{n} words came back for a second try. You got them." |
| helped | "You wrote {word} with the word shown." | "You wrote {n} words with the word shown." |
| missed | "{word} is in My words to practise." | "{n} words are in My words to practise." |
FR: "{word} est revenu pour un second essai. Réussi." / "{n} mots sont revenus pour un second essai. Réussis." · "Vous avez écrit {word} en voyant le mot." / "Vous avez écrit {n} mots en voyant le mot." · "{word} est dans Mes mots pour vous entraîner." / "{n} mots sont dans Mes mots pour vous entraîner." (Use the catalog's existing FR for "My words" if it differs from "Mes mots".)

## 8. Spelling correction without strikethrough

- `spell-step.tsx` ~L92: attempt in `text-foreground` (lesson) / `text-foreground-secondary` (review), labelled "You wrote", **no line-through**.
- Correct answer highlights differing letters: `mobile/src/utils/letter-diff.ts` splits NFC strings with `/\P{M}\p{M}*/gu`, aligns via LCS, returns `{ letter, differs }[]` for the answer; differing letters render `text-accent-text` + underline.
- Feedback block a11y label: "You wrote {attempt}. The spelling is {answer}."
- `quiz-step.tsx` ~L91-127, `fill-blank-step.tsx` ~L109-130: remove `textDecorationLine: 'line-through'` on the wrong selection; show an X icon from `components/icons` and a11y label suffix ", your answer, wrong".
- Update the `/* Feedback */` comment in `mobile/src/global.css`.

## Edge cases

- Kill mid-review → reopen: same review item, same counter, same `shown`.
- Content edited between sessions → fingerprint mismatch → fresh start.
- No misses → no review phase.
- Supported answer that was right → outcome `helped`, no `markWritten`.
- Two lessons in progress → independent keys.
- Double-tap Continue → second `answer` ignored.

## Out of scope

Persisting in-step drafts, spaced repetition, mastery scores, cross-lesson review, new audio, offline caching.

## Done means

- [ ] `utils/__tests__/lesson-session.test.ts`: lesson `total` constant through lesson phase; review list frozen; for any sequence of all-wrong answers the walk reaches `finish` in ≤ lessonSteps + reviewItems transitions (loop over all lesson fixtures); `markWritten` emitted only for unsupported correct spell; double answer ignored; `addMet` emitted exactly once; `decode` rejects malformed JSON, each invariant violation, and a fingerprint mismatch (same ids, changed correct answer); `progressView` for each phase incl. `isStart`; `reviewOutcomes` dedupe and worst-outcome rule.
- [ ] `hooks/__tests__/use-lesson-session.test.ts` (mocked AsyncStorage): no write before hydration; out-of-order `setItem` resolution leaves the newest revision stored; removal failure on completion still navigates.
- [ ] `utils/__tests__/letter-diff.test.ts`: identical; missing tone mark; `ɖ` vs `d`; different lengths.
- [ ] `pnpm -C mobile exec tsc --noEmit`, `pnpm -C mobile exec eslint .`, `pnpm -C mobile test` exit 0; gates leave `git status` unchanged.
- [ ] `grep -rn "line-through" mobile/src/components/lesson-steps` and `grep -rn "textDecorationLine: 'line-through'" mobile/src` → nothing.
- [ ] Every new msgid has a French msgstr differing from English.
- [ ] Simulator (argent), EN and FR: (a) miss two → counter stays k/N, then "Review · 1 of 2", VoiceOver announcement fires once; (b) miss one again → answer shown in text, no third attempt, Finish "…is in My words to practise"; (c) Show the word again → overlay, VoiceOver cannot reach the question behind, Back returns with typed letters intact; answer right → Finish "with the word shown", Profile spelled-correctly count unchanged; (d) submit an answer, immediately background and `restart-app`, reopen → same step and counter; (e) press "Next lesson" → reopening that lesson starts at the cover.

## Review findings rejected

- #3 (persist in-step drafts) — rejected; the guarantee is narrowed to submitted answers instead (stated in Goal).
