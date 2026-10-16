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

The owner chose option 3 (spec "Amendment 2026-10-16"). Note: the "wait" option above was
labelled (1) here, and the coordinator called it "(a)".

## Resumed after the amendment (2026-10-16 ~21:00 UTC)

- `pnpm` 12.3.4 matches `*` patterns in `minimumReleaseAgeExclude`. Checked in a scratch
  project: `expo-modules-jsi@58.0.15` and `@expo/schema-utils@58.0.2` fail with `"nothing"`
  excluded and resolve with `"expo-*"` and `"@expo/*"`.
- `scripts/renovate.js` now exempts `@expo/*`, `expo-*`, `expo`, `babel-preset-expo` and
  `jest-expo`, and keeps every other existing entry (with its comment) ahead of them.
- `admin/package.json`: `@cloudflare/vite-plugin` pinned to `2.0.0-beta.sha-52b0dc0e9` (what
  develop's lockfile resolves).
- Install then needed:
  - `allowBuilds: '@parcel/watcher': false`. It is new with jest 30 and ships prebuilt binaries.
  - `pnpm update -r @expo/metro-config @react-native/metro-config metro metro-transform-worker metro-cache`.
    The auto-installed peers of uniwind and `@lingui/metro-transformer` stayed on SDK 57's
    metro 0.84.5, so `check-duplicates` failed. This changed no specifier in any package.json.
- Installed: expo 58.0.11, react-native 0.88.0, react 19.3.0, react-dom 19.3.0,
  babel-preset-expo 58.0.17 (exact pin, one copy), jest 30.5.2, jest-expo 58.0.11,
  expo-router 58.0.23, uniwind 1.12.2, @types/react 19.3.0, @react-native-firebase/app 26.0.0.

## Gates (final tree, after `rm -rf mobile/node_modules && pnpm install --frozen-lockfile`)

| # | Command | Exit | Result |
|---|---|---|---|
| 1 | `cd mobile && pnpm exec tsc --noEmit -p .` | 0 | |
| 2 | `pnpm --filter ./mobile lint:check` | 1 | Same 4 errors and 40 warnings as the baseline. Pass under the amended criterion. |
| 3 | `cd mobile && pnpm exec jest` | 0 | 44/44 suites, 493/493 tests (4 new in `with-firebase-configure.test.ts`) |
| 4 | `pnpm check-duplicates` | 0 | 15 watched packages, one version each. `pnpm why babel-preset-expo -r`: 58.0.17 only |
| 5 | `npx expo-doctor@1.21.5` | 1 | **Fails, see below** |
| 6 | `npx expo export:embed --platform ios --dev false --reset-cache ...` | 0 | 2461 modules |
| 7 | `rm -rf ios && npx expo prebuild --platform ios --no-install` | 0 | `ios/KabiyeenPoche/SceneDelegate.swift` exists. `AppDelegate.swift` has 1 `FirebaseApp.configure()` and 1 `import FirebaseCore` |
| 10 | `npx expo config --type public` | 0 | `version: '0.1.0'`, `runtimeVersion.policy: 'appVersion'` |
| 11 | `test ! -e mobile/android`, `git ls-files mobile/ios mobile/android` | 0, empty | `uniwind-types.d.ts` reverted after each bundle |
| 12 | `npx expo export --platform web --output-dir <scratch>/web` | 7 | **Fails, see below** |
| 13 | `node scripts/renovate.js` a second time | 0 | Leaves the 4 files unchanged, and the cf lines survive. Admin importer vs develop: only the specifier line (`beta` → the pinned version) |

Prebuild with `GOOGLE_SERVICES_PLIST` pointed at the main checkout's plist, because the
worktree has none. The RNFB warning "Unable to determine correct Firebase insertion point"
still prints, since RNFB's mod runs before ours. Our plugin then inserts the call. The
warning disappears once RNFB ships #9336, which is the signal to delete the plugin.
Prebuild also prints "@react-native-firebase/auth: Skipping iOS openURL fix because no
'openURL' method was found". The app does not call Firebase Auth from `src/`.

### Item 5: expo-doctor 1.21.5 fails one check ("packages match versions required by installed Expo SDK")

- `jest` expected `~29.7.0`, found 30.5.2. `@types/jest` expected 29.5.14, found 30.0.0.
  Expo's version API (`relatedPackages` for SDK 58) still lists jest 29. jest-expo 58.0.11
  depends on `@jest/globals`, `babel-jest`, `jest-snapshot` etc. `^30.0.0`. The spec pins
  jest 30. Owner decision.
- `expo` expected `~58.0.14`, found 58.0.11. renovate.js picks the newest release older than
  the 1d cooldown. 58.0.14 was published 2026-10-16 19:51 UTC, so a re-run after
  2026-10-17 ~19:51 UTC picks it.
- `typescript` expected `~6.0.3`, found 6.0.2. The dependency is
  `npm:@typescript/typescript6@^6.0.2`, and that package has no 6.0.3.
- Fixed: `@types/react` (was 19.2.18, now ~19.3.0).

### Item 12: web export fails after both bundles compile

1. With develop's uniwind 1.9.0, web bundling failed: uniwind's resolver redirects
   react-native-web's `InputAccessoryView` to `uniwind/components/InputAccessoryView`, which
   1.9.0 does not ship. Fixed by moving the lockfile to uniwind 1.12.2 (range `^1.7.0` unchanged).
2. Static rendering needs `EXPO_PUBLIC_SUPABASE_URL`/`_ANON_KEY` (the worktree has no
   `.env.local`). With placeholders, the client and server bundles compile (`+html.tsx`
   included). Rendering then throws `getValueWithKeyAsync is not a function`: `src/lib/supabase.ts`
   gives the Supabase client `expo-secure-store` as storage, and it has no web implementation
   in Node. This is outside `+html.tsx` and unchanged by this branch. Web behaviour is out of scope.

## Item 8: iOS smoke run (main session, 2026-10-16)

iPhone 18 Pro simulator, iOS 27.2, Debug build from the worktree, Metro on 8082, app
uninstalled first, normal Supabase backend.

- First launch failed: RootLayout render error `Cannot read property 'getAssetByID' of
  undefined` (expo-asset via expo-font). Uniwind's resolver swaps `react-native` for its own
  export list, which lacks RN 0.88's new public `AssetRegistry` (uni-stack/uniwind#732).
  Fixed in `8bcf720` (metro.config.js routes expo-asset's import around uniwind).
- After the fix, all pass:
  - Fresh install: onboarding, Skip, Home with live data.
  - Returning user: relaunch goes straight to Home.
  - All five tabs open, and the active-tab rule follows.
  - Lesson: Begin moves 1/24 to 2/24, Close returns Home, and Home shows "Step 2 of 24".
  - Deep link `kabiye://lesson/<id>` while running opens the lesson, and Close returns Home.
  - Dictionary PDF screen: the WebView renders (webview 14).
- Not a pass, outside this branch: the PDF host `www.ingeniumlink.com` returns a Cloudflare
  522 (also from curl), so no PDF loads. This is an outage, not the upgrade.
- Open: after a live Appearance change, the custom tab bar keeps the old colours until the
  next tab press. The root layout's theme does update (`Appearance.getColorScheme()` is
  `dark`, and a tab press repaints the bar dark). Separately, `useAppearance()` keeps state per
  instance, so a change from an explicit Light/Dark to System does not reach the root until
  restart (pre-existing code). An SDK 57 comparison is impossible on this machine: an app
  built with Xcode 27 must adopt the UIScene life cycle, so the SDK 57 build exits at launch.
- The first tap after a fresh launch was ignored twice (Skip, the Profile tab). The second
  tap worked each time.
- No audio check: the database holds 0 recordings, so no lesson plays audio.

## Item 9: Android smoke run

Not run. Emulator `Medium_Phone` (emulator-5554) was in use by another project
(`app.mojatable` in front, Gradle builds running).

## Owner decisions, 2026-10-16

1. Item 5 (expo-doctor) accepted with its three mismatches: jest 30 (needed by jest-expo 58),
   expo 58.0.11 (re-run `node scripts/renovate.js` after 2026-10-17 ~19:51 UTC for 58.0.14),
   and typescript 6.0.2 (`@typescript/typescript6` has no 6.0.3).
2. Item 12 (web export) accepted. `+html.tsx` compiles. Static rendering fails on
   `expo-secure-store` in Node, which this branch does not change, and web is out of scope.
3. Item 13 reworded: the admin lockfile may change the `@cloudflare/vite-plugin` specifier only.
4. The tab bar theme bug goes to a follow-up branch, not this one.
5. Item 9 (Android) waits until `Medium_Phone` is free of the other project.
