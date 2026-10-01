# SPEC — Home and Learn: prioritise repeat use

Source: `../design_handoff_laterite/IMPLEMENTATION-REVIEW.md` §3. Order: 4 of 5.

**Prerequisites:** `SPEC-laterite-a11y-foundations.md` (tokens) and `SPEC-finite-review-and-resume.md` (`readLessonSessionSummary`) are in this branch's base.

Revision 2 — folds in the Codex spec review (2026-09-21). Rejected findings at the end.

## Goal

On the first viewport of Home, a learner sees **where to resume or start** and **how to look up a word**; the letter of the week stays, as a secondary feature. Learn lists written lessons in their units and gathers every not-yet-written lesson into one quiet area at the end.

## Status rule (one place)

Add `mobile/src/utils/lesson-status.ts`: `isWritten(status) = status === 'available' || status === null`. Use it in `learn.tsx`, `lesson.tsx` (~L427 `isLessonAvailable`), `use-units.ts` (`useProgressSummary`, `nextLesson`), and Home. Per status on Learn:
- `available` / `null` — listed in its unit (locked-by-progress rows keep today's lock styling).
- `maintenance` — listed in its unit, not pressable, trailing text "Being corrected" (existing msgid from `lesson.tsx`).
- `coming_soon` — not listed in the unit; counted in the trailing block.
- `disabled` — not shown anywhere.

## Data — `mobile/src/hooks/use-units.ts`

1. **`useNextLesson`** (~L195): it already loads all units and lessons. Return `{ lesson, unitTitle, ordinal, writtenInUnit } | null` where `ordinal` is the lesson's 1-based position among written lessons in its unit and `writtenInUnit` their count. Update `nextLesson` helper and all callers (`home.tsx`, `learn.tsx`, `lesson.tsx` if any) and its test `hooks/__tests__/use-path.test.ts` if it covers it.
2. **`useProgressSummary`** (~L221): throw on any Supabase `error` (units, lessons, planned count) instead of silently using `[]`; count lessons with `isWritten`, including `status is null` units. Callers render the sentence only when `data` is defined.
3. **`usePathLessons()`** (new, same file): one query for all lessons with local progress, shaped like `useLessonsWithProgress` (copy its lock/progress logic) so Learn can partition without a query per unit. `useLessonsWithProgress` stays for other callers.
4. Pure `partitionLearnPath(orderedUnits, lessons)` in `mobile/src/utils/learn-path.ts` → `{ units: { unit, lessons }[]; coming: { count: number; unitTitles: string[] } }`: units keep path order; a unit appears in `units` only if it has ≥ 1 listed lesson; `coming.unitTitles` = distinct titles of units holding any `coming_soon` lesson or whose unit status is `coming_soon`, in path order. *(Amended after on-device review: a unit is named only when nothing from it is listed above; a unit whose own status is `maintenance` or `disabled` is skipped entirely; Learn shows the first 5 titles then "and N more units".)*

## Home — `mobile/src/screens/home.tsx`

Order, top to bottom:
1. Header: wordmark only (search circle removed; search moves to 3).
2. **Resume card** — the one dominant action; ink fill, copy the markup of Learn's current-lesson card (`learn.tsx` `LessonRow` `isCurrent` branch).
   - Loading (`useNextLesson` pending or path loading): skeleton of the card's size — search does not jump up.
   - Error: same slot, text "We could not load your next lesson." + "Try again" (`refetch`).
   - `null` (nothing left to open): no card.
   - Data: eyebrow "Continue" if `readLessonSessionSummary(lesson.id)` returns non-null or the learner has completed ≥ 1 lesson, else "Start here"; title; progress line: summary `lesson` → "Step {current} of {total}"; summary `review` → "Review"; no summary → "Lesson {ordinal} of {writtenInUnit} · {unitTitle}". Home re-reads the summary on focus (`useFocusEffect`). A stale summary (content changed since) may show until the lesson is opened — acceptable; the lesson itself validates.
   - One pressable → `/lesson/{id}`, `accessibilityRole="button"`, label "{eyebrow}, {title}, {progress line}". Title max 2 lines.
3. **Search field** — full-width, 52px, `bg-background-tertiary`, rounded, magnifying glass + "Search the dictionary" in `text-foreground-secondary` (5.56:1 on paper; verify on recessed and state the ratio). Pressable → `router.push({ pathname: '/(tabs)/dictionary', params: { focus: String(Date.now()) } })`.
4. Tool row, outline pills: "Alphabet" (existing), "My words", "Keyboard".
5. **Letter of the week**: label (`text-accent-text`, 13px), letter pair at **96px** with line height/margins so no glyph touches the explainer, explainer 17px. Ghost glyph 240px at `opacity-[0.08]`, placed beside this section.
   - Dev-only override: in `__DEV__`, a `letter` search param on the Home route replaces `letterOfTheWeek()` (for screenshots). No effect in production builds.
6. "Today" word — unchanged.

Update the top doc comment: Home now opens on resume + search; the letter is editorial (design review 2026-09-21).

## Dictionary focus — `mobile/src/screens/dictionary/dictionary.tsx`

Hold a `TextInput` ref. `useFocusEffect` + `useLocalSearchParams().focus`: when a `focus` value arrives that differs from the last consumed one, call `ref.current?.focus()` then `router.setParams({ focus: undefined })`. Keyboard focus is **required** behaviour.

## Learn — `mobile/src/screens/learn.tsx`

- Use `usePathLessons` + `partitionLearnPath`; `UnitChapter` receives its lessons as props (no per-unit fetch). Remove the "Soon" pill.
- Trailing block (only if `coming.count > 0`): top rule, label "More lessons coming", sentence "{count} more lessons are being written." (one: "One more lesson is being written."), then `coming.unitTitles` as a quiet list (`text-foreground-secondary`, 15px, `accessibilityRole="text"`, not pressable).

## Tab position

Expo Router `Tabs` keeps screens mounted. Verify only.

## Out of scope

Photography, new Home content types, streaks/notifications, lesson ordering, Profile.

## Done means

- [ ] `utils/__tests__/learn-path.test.ts`: open unit with available + coming_soon lessons → coming lessons excluded from the unit and counted; maintenance listed; disabled hidden; unit with only coming_soon lessons → absent from `units`, title in `coming`; null-status unit treated as written; order preserved.
- [ ] `hooks/__tests__` or `utils/__tests__` for `nextLesson` metadata (ordinal, writtenInUnit) and `lesson-status`.
- [ ] `useProgressSummary` rejects when any query errors (mocked supabase test, or a documented manual check if the hook has no test harness).
- [ ] `pnpm -C mobile exec tsc --noEmit`, `pnpm -C mobile exec eslint .`, `pnpm -C mobile test` exit 0; gates leave `git status` unchanged. Every new msgid has a French msgstr.
- [ ] Simulator (argent) screenshot matrix — iPhone SE (3rd gen) and iPhone 16 Pro × EN/FR × light/dark (8 shots): resume card and search field above the fold.
- [ ] Glyph check (dev override): `ɖ`, `ŋ`, `ɣ`, `ʋ` × EN/FR on iPhone SE — no overlap with the explainer (8 shots).
- [ ] Largest non-accessibility Dynamic Type on iPhone SE, EN and FR: resume card and search still in the first viewport.
- [ ] States: throttle/disable network → skeleton then error with "Try again"; mid-lesson exit → "Step i of N"; after "Next lesson" → "Lesson k of n · Unit".
- [ ] Home search → Dictionary with keyboard up, twice in a row (second arrival also focuses).
- [ ] Learn: exactly one "More lessons coming" block, last on screen; no coming_soon lesson rows inside units.
- [ ] Scroll Learn, switch tab and back: position kept.

## Review findings rejected

None.
