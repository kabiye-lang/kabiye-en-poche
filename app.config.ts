import { ConfigContext, ExpoConfig } from 'expo/config'

import pkg from './package.json'

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
    supportsTablet: true,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      CFBundleAllowMixedLocalizations: true,
      NSUserTrackingUsageDescription:
        'This allows Kabiyè en poche to provide you with personalized learning recommendations and content.',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './src/assets/images/adaptive-icon.png',
      backgroundColor: '#ffffff',
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
        backgroundColor: '#ffffff',
        image: './src/assets/images/splash-icon.png',
        dark: {
          image: './src/assets/images/splash-icon-dark.png',
          backgroundColor: '#000000',
        },
        imageWidth: 200,
      },
    ],
    [
      'expo-build-properties',
      {
        buildReactNativeFromSource: true,
        useHermesV1: true,
      },
    ],
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
