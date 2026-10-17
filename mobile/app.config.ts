import { ConfigContext, ExpoConfig } from 'expo/config'

import pkg from '../package.json' with { type: 'json' }

// Poche is capitalised: it is the product's name, and every screen inside spells it
// that way. The home-screen icon label and the deep-link prompt were the exceptions.
const DISPLAY_NAME = 'Kabiyè en Poche'

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  // No è here: `name` also names the Xcode target. SDK 58's prebuild turns è into e
  // (KabiyeenPoche) while eas-cli 25, still on @expo/config-plugins 55, drops it
  // (KabiyenPoche), and EAS then fails with "Could not find target". Users see
  // DISPLAY_NAME instead, through CFBundleDisplayName and the Android plugin below.
  // Put the è back once eas-cli depends on @expo/config-plugins 58 or later.
  name: 'Kabiye en Poche',
  slug: 'kabiye-en-poche',
  version: pkg.version,
  orientation: 'portrait',
  icon: './src/assets/images/icon.png',
  scheme: 'kabiye',
  userInterfaceStyle: 'automatic',
  assetBundlePatterns: ['**/*'],
  ios: {
    icon: './src/assets/images/ios-icon.icon',
    bundleIdentifier: 'com.kabiyeenpoche.app',
    googleServicesFile: process.env.GOOGLE_SERVICES_PLIST ?? './GoogleService-Info.plist',
    supportsTablet: true,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      CFBundleAllowMixedLocalizations: true,
      CFBundleDisplayName: DISPLAY_NAME,
      NSUserTrackingUsageDescription:
        'This allows Kabiyè en poche to provide you with personalized learning recommendations and content.',
    },
  },
  android: {
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
    adaptiveIcon: {
      foregroundImage: './src/assets/images/adaptive-icon.png',
      backgroundColor: '#C4451C',
      monochromeImage: './src/assets/images/adaptive-icon.png',
    },
    package: 'com.kabiyeenpoche.app',
    permissions: ['android.permission.INTERNET'],
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './src/assets/images/favicon.png',
  },
  plugins: [
    [
      'expo-splash-screen',
      {
        backgroundColor: '#F4EBDD',
        image: './src/assets/images/splash-icon.png',
        dark: {
          image: './src/assets/images/splash-icon-dark.png',
          backgroundColor: '#221913',
        },
        imageWidth: 200,
      },
    ],
    [
      'expo-build-properties',
      {
        android: { usePrecompiledHeaders: true },
        ios: {
          useFrameworks: 'static',
          /**
           * RNFirebase iOS build fix using static linking (maintainer-recommended).
           *
           * We previously used `buildReactNativeFromSource: true` as a workaround to fix
           * RNFirebase + Firebase iOS SDK build issues, but it disabled Expo’s precompiled RN for
           * iOS builds and significantly increased build times.
           * - N.B. For links & context on why `buildReactNativeFromSource: true` was added,
           * refer to comments in the "previous commit".
           *
           * This `forceStaticLinking` configuration follows the Expo maintainer’s suggested solution:
           * https://github.com/expo/expo/issues/39607#issuecomment-3337284928
           * https://github.com/invertase/react-native-firebase/issues/8657#issuecomment-3667922545
           * - Now precompiled builds are enabled and build times are reduced and RNFB builds work on iOS.
           *
           * ⚠️ IMPORTANT: If installing/removing react-native-firebase npm packages, ensure you also update this list.
           * - Look for `s.name` property in node_modules/@react-native-firebase/<module>/<module>.podspec to get the Pod name.
           */
          forceStaticLinking: [
            'RNFBAnalytics',
            'RNFBApp',
            'RNFBCrashlytics',
            // 'RNFBInAppMessaging',
            // 'RNFBInstallations',
            // 'RNFBPerf',
          ],
        },
      },
    ],
    '@react-native-firebase/app',
    // SDK 58 AppDelegate has no line RNFB 26 can anchor to: see the plugin's header.
    './plugins/with-firebase-configure',
    '@react-native-firebase/auth',
    '@react-native-firebase/crashlytics',
    // `name` has no è (see above): give the launcher label its è back.
    ['./plugins/with-android-app-name', DISPLAY_NAME],
    'expo-router',
    [
      'expo-localization',
      {
        supportedLocales: {
          ios: ['en', 'fr'],
          android: ['en', 'fr'],
        },
      },
    ],
    'expo-web-browser',
    'expo-audio',
    'expo-secure-store',
    'expo-asset',
  ],
  experiments: {
    tsconfigPaths: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: '804c3e23-d136-4f76-81b4-c0ec5ba01117',
    },
    supportsRTL: false,
  },
  locales: {
    en: './locales/en.json',
    fr: './locales/fr.json',
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
  updates: {
    url: 'https://u.expo.dev/804c3e23-d136-4f76-81b4-c0ec5ba01117',
  },
})
