# SPEC — Laterite accessibility foundations

Source: `../design_handoff_laterite/IMPLEMENTATION-REVIEW.md` §4 (and the contrast/touch-target parts of §5). That document takes precedence over the original Laterite README/mocks for these issues. Order: 1 of 5 — later specs use the tokens defined here.

Revision 2 — folds in the Codex spec review (2026-09-21). Rejected findings are listed at the end.

## Goal (scoped)

Fix the **enumerated** contrast and target-size defects below — the ones the design review found plus those found while writing this spec — and add a test that locks the token pairs in place. This is not a full audit of every pair in the app; controls and pairs not listed are out of scope and noted as follow-ups if the implementer sees them.

Thresholds: WCAG 2.1 — 4.5:1 normal text; 3:1 for large text (≥ 24px regular, ≥ 18.66px bold) and non-text UI graphics. **Disabled controls are exempt** (WCAG 1.4.3 "inactive user interface component"), so `opacity-40` disabled styling stays.

## Measured facts (relative luminance, WCAG formula)

| Pair | Ratio |
|---|---|
| `#C4451C` on paper `#F4EBDD` | 4.22 — fails normal text |
| `#B03C17` on paper / recessed `#EADFCD` / leaf `#FFFFFF` | 5.07 / 4.55 / 5.99 |
| white on `#B03C17` | 5.99 |
| `#E07A55` on ink `#221913` / card `#2E241C` | 5.82 / 5.11 |
| white on `#C4451C` (alpha 1 / .95 / .9 / .85 / .8 / .7) | 4.98 / 4.65 / 4.33 / 4.03 / 3.74 / 3.21 |
| white on `#E07A55` (dark-mode `bg-accent` today) | **2.96 — fails** |
| white on paper `#F4EBDD` (dark-mode primary button today: `bg-primary` = paper, `text-white`) | **~1.1 — fails** |
| `#D9CDB9` on paper (My words unwritten pencil) | ~1.33 |
| `#6B5A4E` on paper | 5.56 |

## Decisions

1. **`--color-accent-text`** — earth red for text below large size. light `#B03C17`, dark `#E07A55`. `--color-accent` (`#C4451C` / `#E07A55`) remains for large glyphs/words, decorative marks and non-text graphics.
2. **Accent fills**: `--color-accent-fill` = `#C4451C` in **both** themes; `--color-on-accent` = `#FFFFFF` in both; `--color-accent-fill-pressed` = `#B03C17` in both (white on it 5.99). Every laterite ground or laterite button uses these. Pressed states use the opaque pressed token, never `/90` alpha.
3. **No translucent text on an accent fill.** Text/icons on `bg-accent-fill` use `text-on-accent` at full opacity. Alpha only on non-text decoration (e.g. `border-white/30`). Disabled (`opacity-40`) is exempt per the Goal.
4. **Button text follows its ground.** In `mobile/src/components/ui/button.tsx` `textVariants`: `primary` → `text-primary-foreground` (ink on paper in dark, paper on ink in light — 14.6:1), `accent` → `text-on-accent`, `secondary` → verify what `bg-secondary` resolves to in both themes and pick the token that gives ≥ 4.5:1 (state the ratio). `buttonVariants`: `accent: 'bg-accent-fill active:bg-accent-fill-pressed'`; `primary` pressed: replace `active:bg-primary/90` with `active:opacity-90` **only if** the resulting text still meets 4.5:1 in both themes, else leave pressed as the base colour. Also fix the loading spinner colour if it is hardcoded white.
5. **`listen-type-step.tsx` ~L179**: success heading uses `text-background` on `bg-background-tertiary` (near-invisible in both themes) → `text-foreground`.
6. **Fix the misleading comment** in `mobile/src/global.css` ("Passes 4.5:1 on paper only at >= 24px…"): state 4.22:1, that it qualifies only as large text, and point small text to `accent-text`.
7. **Hit areas are separate from visual size.**
   - Isolated controls get ≥ 44×44 via `hitSlop` or padding: lesson close (`progress-bar.tsx` ~L102), Home search (`home.tsx` ~L85), Learn play circle (`learn.tsx` ~L173), Learn "Change" link (`learn.tsx` ~L66-69). Copy `hitSlop={8}` from `screens/dictionary/word.tsx:118`.
   - **Keyboards** (`screens/keyboard.tsx` ~L171-203, spell tray in `components/lesson-steps/spell-step.tsx`): 44pt width is not achievable at 10–11 columns on a 320pt screen, and the design review asks only that keys "make deliberate use of available space without overlapping". So: key **height ≥ 44**, horizontal `hitSlop` = half the inter-key gap (adjacent hit areas touch, never overlap), and each key's hit width ≥ **24pt** at 320pt screen width (WCAG 2.2 SC 2.5.8). Document this rule in a comment at the key component.
8. **Mobile legibility**
   - Alphabet type label (`screens/alphabet-list.tsx` ~L133-141): ≥ 12px, full-opacity `text-foreground-secondary`. Tile `accessibilityLabel` (~L113) → `"{letter}, {type}"` with the localized type word.
   - My words unwritten pencil (`screens/dictionary/my-words.tsx` ~L108): outline in `text-foreground-secondary`. A single legend line above the list, pencil icon component + text. The legend wording is owned by `SPEC-honest-outcomes.md` ("spelled correctly at least once"); use that wording here.
9. **Native colour consumers**: add `accentText`, `accentFill`, `onAccent` to `TOKENS` in `mobile/src/hooks/use-theme-color.ts` (+ `useAccentFillColor`, `useOnAccentColor`) and migrate `components/audio-play-button.tsx` (~L48, uses `useAccentColor` with `usePrimaryForegroundColor`) to the fill/on-accent pair if it draws an accent ground. Check `utils/design-system-nativewind.ts` `brandColors.accent` / `_tintColorLight` usages: if any draws small text, point it at `#B03C17`.

## Files

**Mobile**
- `mobile/src/global.css` — new tokens in both `@variant light` and `@variant dark`; comment fix.
- `mobile/src/hooks/use-theme-color.ts`, `components/audio-play-button.tsx`, `utils/design-system-nativewind.ts` — decision 9.
- `components/ui/button.tsx` — decision 4.
- `text-accent` below large size → `text-accent-text` (27 call sites in 10–19px across the 25 files matching `text-accent` under `mobile/src`).
- `bg-accent` carrying text/icons → `bg-accent-fill` + `text-on-accent`: `cover-step.tsx`, `finish-step.tsx`, `spell-step.tsx` (Check key), `listen-type-step.tsx`, `audio-step.tsx`, `learn.tsx` (play circle), `keyboard.tsx`, `alphabet-letter.tsx`, `alphabet-list.tsx`, `app/(onboarding)/index.tsx`, `progress-bar.tsx` (`accent` tone: `ground: 'bg-accent-fill'`, `counter: 'text-on-accent'`; `current: 'bg-white'` stays).
- `listen-type-step.tsx` — decision 5. `alphabet-list.tsx`, `my-words.tsx` — decision 8. Hit areas — decision 7.
- `mobile/src/locales/{en,fr}/messages.po` — new strings via `pnpm -C mobile i18n:extract`; hand-written French.

**Website**
- `website/src/index.css` — `--color-laterite-text: #B03C17`.
- Small laterite text on paper → `text-laterite-text`: `pages/Home.tsx` ~L288 (13px subtitle), ~L565 (check glyph), `components/kabiye-keyboard.tsx` ~L119. (Newsletter error text: skip — `SPEC-website-acquisition.md` removes the component.) Large uses (hero ~L301, glyph ~L336, audience glyphs ~L471, modal h2) stay.
- Contribute section on `bg-laterite` (~L591-626): `text-white/70|80|85` → `text-white`.
- Language toggle (~L259-266, 40px) → `min-h-11`.
- Alphabet tiles and Delete/Clear/Copy: `focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2`.
- Add `"lint:check": "eslint ."` to `website/package.json` (and to `mobile/package.json` if absent) so gates do not mutate source.

## §4 traceability

| §4 item | Owner |
|---|---|
| Darker small-text accent; bright accent on dark; text on fills | this spec |
| Glyph/copy collision on Home | `SPEC-home-learn-priorities.md` (Home is rebuilt there); letter detail checked here (screenshot only) |
| 44pt header controls; keyboard hit regions | this spec (decision 7) |
| Alphabet/status labels; pencil not colour-only | this spec (decision 8) |
| Reduced motion, Read-and-choose tap, design annotations in copy | already met (audit 2026-09-21: `app/_layout.tsx:144-148`, `read-choose-step.tsx`, no user-facing matches) — no change |
| Missing-audio messaging | already met — no change |
| Larger system text, long entries, French throughout | verification only, below |

## Out of scope

A complete pair/control inventory; new brand colours; layouts; Home hierarchy (spec 4); copy (spec 2).

## Edge cases

- Spot the letter keeps `accent-on-ink`; do not replace with `accent-text`.
- Uniwind must emit the new utilities; confirm on a rendered screen.
- `text-accent` substring also matches `text-accent-text` — use `text-accent(?![-\w])` in searches.

## Done means

- [ ] `mobile/src/utils/__tests__/contrast.test.ts` **reads `mobile/src/global.css`** (fs + regex on the `@variant light` / `@variant dark` blocks) and asserts: accent-text on paper/recessed/leaf ≥ 4.5 (light) and on `#221913`/`#2E241C` ≥ 4.5 (dark); on-accent on accent-fill and accent-fill-pressed ≥ 4.5 in both; primary-foreground on primary ≥ 4.5 in both. It also asserts parity: every token in `use-theme-color.ts` `TOKENS` equals the CSS value of the same name.
- [ ] `mobile/src/utils/__tests__/accent-usage.test.ts` scans `mobile/src/**/*.tsx` source: no `className` string contains `text-accent` (not followed by `-`) together with a size class below `text-[24px]` (i.e. `text-[9..23px]`, `text-xs|sm|base|lg|xl`) unless the line carries a `// large-text:` justification comment; no string pairs `bg-accent-fill` with `text-white/` or `text-on-accent/`.
- [ ] `pnpm -C mobile exec tsc --noEmit`, `pnpm -C mobile exec eslint .`, `pnpm -C mobile test`, `pnpm -C website build`, `pnpm -C website lint:check` exit 0, and `git status` shows no changes produced by the gates.
- [ ] Catalog: every msgid added in this branch has a non-empty French `msgstr` that differs from English (script or manual table in the report); any msgid removed by `--clean` is listed in the report.
- [ ] iOS simulator (argent), light **and** dark, screenshots: Home, Learn, lesson Cover, Spell step (tray visible), Finish, Alphabet list, Alphabet letter detail, My words, a screen with a primary button. Dark Cover/Finish show white on `#C4451C`; dark primary buttons are readable.
- [ ] Hit areas via `describe` / `native-view-at-point`: lesson close, Home search, Learn "Change" respond at their 44pt edge; two adjacent keyboard keys each respond at their own hitSlop edge and not the neighbour's.
- [ ] One screen checked at the largest non-accessibility Dynamic Type size and in French (Spell step + Alphabet list): no clipping of changed labels.
- [ ] Website at 320 / 375 / 1280px: language toggle ≥ 44px tall; Tab through the alphabet shows the designed ring.

## Review findings rejected

- "Goal claims every pair/control" — accepted by **narrowing the Goal** rather than inventorying the whole app; a full audit is a separate task.
- "Add Dynamic Type / long-entry fixtures for every screen" — partially: one representative check here; Home owns its own matrix in spec 4.
