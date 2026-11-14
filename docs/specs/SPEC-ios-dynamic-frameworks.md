# SPEC: build iOS with dynamic frameworks so Firebase 27 installs

Status: approved (owner, 2026-11-14: option b, the gate is a local clean prebuild and Release build). Stage 2 skipped: build config only, no data, auth or schema change.

## Why

A clean iOS prebuild fails at `pod install` on `develop`:

```
[react-native-firebase] SPM + static linkage is not supported.
```

`@react-native-firebase/*` went from 26.x to 27.1.0 in #84 (2026-10-30), after build 43. Firebase Apple SDK 13 ships only through Swift Package Manager, and RNFB 27 refuses static pod linkage (`firebase_spm.rb`, `rnfirebase_fail_if_spm_static_linkage!`). `mobile/app.config.ts:70` sets `useFrameworks: 'static'`. EAS builds from a clean prebuild, so the next paid build fails the same way. The main checkout's `mobile/ios/Pods` dates from 19 Oct, so a local incremental build hides it.

The owner chose option b on 2026-11-14: stay on Firebase 27 and build with dynamic frameworks (RNFB's own fix). Not chosen: going back to 26.x (a), removing Firebase (c).

## Facts the build starts from

- No app code imports Firebase. It is wired in natively only: `@react-native-firebase/app`, `/auth` and `/crashlytics` in `mobile/package.json:38-40` and the plugin list in `mobile/app.config.ts:96-103`. Crashlytics sends crash reports. No screen uses the auth pod.
- RNFB's message names the Expo fix: set `ios.useFrameworks` to `"dynamic"` in the `expo-build-properties` plugin config, then prebuild again.
- `forceStaticLinking` (`app.config.ts:88-95`) lists `RNFBAnalytics`, `RNFBApp`, `RNFBCrashlytics`. It was the workaround for static frameworks with Expo's precompiled React Native. `RNFBAnalytics` is not even installed.
- `mobile/plugins/with-firebase-configure.js` inserts `FirebaseApp.configure()` because RNFB 26 could not find an insertion point in the SDK 58 `AppDelegate.swift`. Its header says: delete it when RNFB ships the fix. RNFB 27's plugin now matches `return super.application(application, didFinishLaunchingWithOptions: launchOptions)` (`plugin/src/ios/appDelegate.ts:104`), which is the line this plugin anchors to. The plugin does nothing when the call is already there.
- On 2026-11-14 a checker set `"ios.useFrameworks": "dynamic"` by hand in a prebuilt `ios/Podfile.properties.json`. `pod install` then passed, a Debug build succeeded and the app ran on a simulator. That was Debug only, and did not check Firebase at launch.

## The change

1. `mobile/app.config.ts`: `useFrameworks: 'dynamic'`. Replace the long `forceStaticLinking` comment with a short one: why dynamic (RNFB 27 is SPM-only and refuses static linkage), and a link to https://rnfirebase.io/ios-spm.
2. `forceStaticLinking`: remove it if the build passes without it. If a pod then fails to build or link, keep only the entries that fix it, and say which and why in the comment. Do not keep `RNFBAnalytics`.
3. `mobile/plugins/with-firebase-configure.js`: run a clean prebuild without it (take it out of the plugin list). If the generated `AppDelegate.swift` has `import FirebaseCore` once and `FirebaseApp.configure()` once, and prebuild prints no "Unable to determine correct Firebase insertion point", delete the plugin, its test if one exists, and its line in `app.config.ts`. If not, keep it and say so in the PR.
4. Note in the PR whether Expo's precompiled React Native is still used with dynamic frameworks, and the clean build time. If it falls back to building React Native from source, say so: that is acceptable, but the owner should know before an EAS build.
5. `scripts/renovate.js` (repo root): no change needed for option b. Check that it does not pin or downgrade Firebase.

Do not change Android (`android: { usePrecompiledHeaders: true }` stays). Do not add or remove Firebase packages.

## Files to touch

| Path | Change |
|---|---|
| `mobile/app.config.ts` | `useFrameworks: 'dynamic'`, `forceStaticLinking` removed or reduced, comment, maybe the `with-firebase-configure` line |
| `mobile/plugins/with-firebase-configure.js` | Deleted if step 3 allows |
| Tests of that plugin (if any, `git grep with-firebase-configure`) | Deleted with it |

`mobile/ios` is gitignored prebuild output. Nothing in it is committed.

## How to check it (no paid build)

Run in the worktree, from `mobile/`, with `PATH=/opt/homebrew/bin:$PATH`. Set `GOOGLE_SERVICES_PLIST=/Users/mrk/devs/kbp/kabiye-en-poche/mobile/GoogleService-Info.plist` (the file is gitignored, so the worktree has none). The worktree also needs `mobile/.env.local` copied from the main checkout (gitignored, remove it after), or the app shows "Missing Supabase environment variables".

1. `rm -rf ios && npx expo prebuild --platform ios --clean`. Save the output. It must not print the Firebase insertion-point warning.
2. `cd ios && pod install`. It must pass with no RNFB error.
3. A Release build for the simulator: `npx expo run:ios --configuration Release --device <free simulator UDID>` (or `xcodebuild -workspace ... -configuration Release -sdk iphonesimulator`). It must succeed.
4. Launch it on a simulator. Use argent tools for the simulator. Port 8081 may belong to another project's Metro: check with argent `debugger-status` and leave other sessions' Metro and simulators alone. Then:
   - The app opens to onboarding or Home with no red box and no crash.
   - Find `FirebaseApp.configure` in the log: Firebase is configured once. Look for "[FirebaseCore]" lines and no "Default app has already been configured".
   - Look for "Class ... is implemented in both" warnings on Firebase or Google classes. RNFB warns that dynamic linkage can duplicate Firebase classes. None should appear. If one does, stop and report it: it is a decision for the owner.
   - Open a lesson and the dictionary once.
5. `pnpm exec tsc --noEmit -p .`, `pnpm exec eslint app.config.ts` and `pnpm exec jest` pass.

## Done means

- A clean prebuild and `pod install` pass with Firebase 27.1.0 (the RNFB error is gone).
- A Release simulator build succeeds and launches: no crash, Firebase configured once, no duplicate-class warnings.
- `with-firebase-configure` is deleted, or the PR says why it stays.
- The PR states the clean build time, whether precompiled React Native is used, and what happened to `forceStaticLinking`.
- typecheck, lint and jest pass.
- It merges into `develop`. An EAS build stays a separate paid step on the owner's yes.

## Out of scope

- Moving off Firebase, or replacing Crashlytics.
- Removing the unused auth pod.
- An EAS build, local or remote.
