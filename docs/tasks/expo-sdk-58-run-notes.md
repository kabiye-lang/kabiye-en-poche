# Expo SDK 58 upgrade — run notes

Spec: `docs/specs/SPEC-expo-sdk-58.md`. Branch `chore/expo-sdk-58`, worktree `.claude/worktrees/expo-sdk-58`.

## 0. Baseline (2026-10-16, before any change)

Base commit: `bf6cdf1` (`develop`). Installed with `pnpm install --frozen-lockfile` (pnpm 12.3.4).

- `pnpm --filter ./mobile lint:check`: **exit 1** — 4 errors, 40 warnings. The 4 errors are
  pre-existing prettier errors on `develop`, in two files this upgrade does not touch:
  `src/hooks/__tests__/use-conjugation.test.ts` (3) and `src/types/dictionary.ts` (1).
  Done item 2 ("exits 0") cannot hold without fixing them; the pass criterion used here is
  "same 4 errors, no new error, no warning outside this list". Open point for the owner.
- `cd mobile && pnpm exec jest`: **exit 0** — 43/43 suites, 489/489 tests, 1 snapshot.

Baseline lint list (severity, file:line:col, rule):

- warning `__tests__/word-audio.test.tsx:12:17` @typescript-eslint/no-require-imports
- warning `__tests__/word-audio.test.tsx:18:20` @typescript-eslint/no-require-imports
- warning `__tests__/word-audio.test.tsx:30:20` @typescript-eslint/no-require-imports
- warning `__tests__/word-audio.test.tsx:31:14` @typescript-eslint/no-require-imports
- warning `__tests__/word-empty-state.test.tsx:12:17` @typescript-eslint/no-require-imports
- warning `__tests__/word-empty-state.test.tsx:24:20` @typescript-eslint/no-require-imports
- warning `__tests__/word-empty-state.test.tsx:25:14` @typescript-eslint/no-require-imports
- warning `__tests__/word-empty-state.test.tsx:33:26` @typescript-eslint/no-require-imports
- warning `__tests__/word-empty-state.test.tsx:34:14` @typescript-eslint/no-require-imports
- warning `__tests__/word-empty-state.test.tsx:44:20` @typescript-eslint/no-require-imports
- warning `__tests__/word-empty-state.test.tsx:45:14` @typescript-eslint/no-require-imports
- warning `__tests__/wotd.test.tsx:14:20` @typescript-eslint/no-require-imports
- warning `__tests__/wotd.test.tsx:17:18` @typescript-eslint/no-require-imports
- warning `__tests__/wotd.test.tsx:25:20` @typescript-eslint/no-require-imports
- warning `__tests__/wotd.test.tsx:42:26` @typescript-eslint/no-require-imports
- warning `__tests__/wotd.test.tsx:45:18` @typescript-eslint/no-require-imports
- warning `__tests__/wotd.test.tsx:49:18` @typescript-eslint/no-require-imports
- warning `src/app/_layout.tsx:101:13` no-restricted-syntax
- warning `src/app/_layout.tsx:104:5` react-you-might-not-need-an-effect/no-initialize-state
- warning `src/app/_layout.tsx:108:13` no-restricted-syntax
- warning `src/app/_layout.tsx:109:9` react-you-might-not-need-an-effect/no-event-handler
- warning `src/app/_layout.tsx:112:13` no-restricted-syntax
- warning `src/app/_layout.tsx:113:9` react-you-might-not-need-an-effect/no-event-handler
- warning `src/components/lesson-steps/audio-step.tsx:42:13` no-restricted-syntax
- warning `src/components/lesson-steps/audio-step.tsx:51:6` react-hooks/exhaustive-deps
- warning `src/components/lesson-steps/listen-choose-step.tsx:51:13` no-restricted-syntax
- warning `src/components/lesson-steps/listen-choose-step.tsx:60:6` react-hooks/exhaustive-deps
- warning `src/components/lesson-steps/listen-type-step.tsx:57:13` no-restricted-syntax
- warning `src/components/lesson-steps/listen-type-step.tsx:66:6` react-hooks/exhaustive-deps
- warning `src/components/lesson-steps/teach-step.tsx:55:36` react-you-might-not-need-an-effect/no-event-handler
- warning `src/components/navigation/tab-bar.tsx:31:13` no-restricted-syntax
- warning `src/components/navigation/tab-bar.tsx:32:9` react-you-might-not-need-an-effect/no-event-handler
- warning `src/components/navigation/tab-bar.tsx:33:27` react-you-might-not-need-an-effect/no-pass-data-to-parent
- warning `src/components/navigation/tab-bar.tsx:37:9` react-you-might-not-need-an-effect/no-event-handler
- error `src/hooks/__tests__/use-conjugation.test.ts:1:1` prettier/prettier
- error `src/hooks/__tests__/use-conjugation.test.ts:2:58` prettier/prettier
- warning `src/hooks/__tests__/use-conjugation.test.ts:4:1` import/first
- error `src/hooks/__tests__/use-conjugation.test.ts:15:12` prettier/prettier
- warning `src/hooks/use-audio-index.ts:203:12` react-you-might-not-need-an-effect/no-event-handler
- warning `src/hooks/use-debounce.ts:12:13` no-restricted-syntax
- warning `src/hooks/use-path.ts:64:13` no-restricted-syntax
- warning `src/screens/lesson.tsx:197:12` react-you-might-not-need-an-effect/no-event-handler
- error `src/types/dictionary.ts:12:1` prettier/prettier
- warning `src/utils/__tests__/audio-session.test.ts:11:17` @typescript-eslint/no-require-imports

## Dependency bump — blocked at install (2026-10-16 ~20:50 UTC)

Done so far (uncommitted in the working tree):

- `mobile/package.json` `expo` → `58.0.0`, then `node scripts/renovate.js`:
  picked `expo@58.0.11` (published 2026-10-15; latest 58.0.14). Manifest: `react-native 0.88.0`,
  `react 19.3.0`, `jest-expo ~58.0.11` (no `-rc`).
- `renovate.js` rebuilds `minimumReleaseAgeExclude` from Expo packages only, so it **dropped the
  hand-added `@cloudflare/vite-plugin` and `cf` lines** (added in 99ceec4). Restored them.
- Manual pins: `@react-native/jest-preset ^0.88.0`, `@react-native/eslint-config ^0.88.0`,
  `jest ~30.5.0` (30.5.2 is the latest 30), `@types/jest ^30.0.0`, `babel-preset-expo ~58.0.15`
  (the range `expo@58.0.11` declares; to be made exact after install).

`PATH=/opt/homebrew/bin:$PATH pnpm install` (and `--filter ./mobile`) fails: "9 versions do not
meet the minimumReleaseAge constraint" (cutoff 1440 min). Two independent causes:

1. **Excluded Expo packages float to today's releases and drag non-excluded deps.**
   `expo-modules-core` (excluded) resolves to 58.0.22 (published 2026-10-16 19:52 UTC), which
   requires `expo-modules-jsi ~58.0.15` (19:48 UTC, only version in range, not excluded).
   `expo-router` (excluded) resolves to 58.0.23, and `@expo/cli` 58.1.11 likewise, which require
   `@expo/schema-utils ^58.0.2` (19:48 UTC, not excluded). Recurs on any day Expo ships a patch wave.
2. **`admin/package.json` uses the dist-tag `"@cloudflare/vite-plugin": "beta"`.** Any non-frozen
   install re-resolves it; today's beta pulls young `@cloudflare/build-output-utils@0.9.3`,
   `@cloudflare/config@0.27.0`, `@cloudflare/runtime-types@0.1.12`,
   `miniflare@5.20261012.1-beta`. This blocks any lockfile regeneration in the repo today,
   independent of the SDK work, and means admin's importer moves on every non-frozen install.

Options for the owner: (1) wait until the young packages mature (earliest after
2026-10-17 ~19:53 UTC, if nothing new is published); (2) one-time approval for this install
(`pnpm install --yes` answers the approval prompt; not run); (3) durable fix: have
`scripts/renovate.js` keep hand-added exclude lines and also exclude the non-bundled
`expo-modules-*` / `@expo/*` deps, and pin admin's cloudflare specifier to a concrete version.
