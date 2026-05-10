import { ConfigContext, ExpoConfig } from 'expo/config'

import pkg from './package.json' with { type: 'json' }

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Kabiyè en poche',
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
      NSUserTrackingUsageDescription:
        'This allows Kabiyè en poche to provide you with personalized learning recommendations and content.',
    },
  },
  android: {
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
    adaptiveIcon: {
      foregroundImage: './src/assets/images/adaptive-icon.png',
      backgroundColor: '#F5F3F7',
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
        backgroundColor: '#F5F3F7',
        image: './src/assets/images/splash-icon.png',
        dark: {
          image: './src/assets/images/splash-icon-dark.png',
          backgroundColor: '#1A1A2E',
        },
        imageWidth: 200,
      },
    ],
    [
      'expo-build-properties',
      {
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
    '@react-native-firebase/auth',
    '@react-native-firebase/crashlytics',
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
    enableBsdiffPatchSupport: true,
  },
})
