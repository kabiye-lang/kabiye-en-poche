# mobile gotchas

- Uniwind's Metro resolver replaces every `react-native` import with a fixed export list. A dependency that uses a newer RN export crashes at launch with `Cannot read property 'X' of undefined` (expo-asset and `AssetRegistry` on RN 0.88, uni-stack/uniwind#732). Check: the red-box stack names the dependency. Route its import around Uniwind in `metro.config.js`.
- An app built with Xcode 27 must use the iOS scene life cycle, so SDK 57 builds exit at launch on this Mac ("UIScene life cycle is required"). Check: `xcodebuild -version` before you plan a local run of an older SDK.
- Top-level keys in `locales/*.json` go to both iOS and Android. Put iOS-only keys (InfoPlist names like `NS…UsageDescription`) under `"ios"`, or Android `lintVitalRelease` fails with `ExtraTranslation`. Check: `./gradlew app:assembleRelease` without `-x`.
