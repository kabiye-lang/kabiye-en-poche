import pkg from './package.json'

export default {
  expo: {
    name: 'Kabiyè en poche',
    slug: 'kabiyeenpoche',
    version: pkg.version,
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'kabiye',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/images/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      bundleIdentifier: 'com.kabiyeenpoche.app',
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.kabiyeenpoche.app',
      permissions: ['android.permission.INTERNET'],
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: ['expo-router', 'expo-localization', 'expo-web-browser'],
    experiments: {
      typedRoutes: true,
      tsconfigPaths: true,
      reactCompiler: false,
      reactCanary: false,
    },
    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: '441030b9-a714-4719-8c50-f3b7067c4a58',
      },
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
    updates: {
      url: 'https://u.expo.dev/441030b9-a714-4719-8c50-f3b7067c4a58',
    },
  },
}
