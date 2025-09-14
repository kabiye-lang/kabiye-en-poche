import pkg from './package.json'

export default {
  expo: {
    name: 'Kabiyè en poche',
    slug: 'kabiye-en-poche',
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
      "infoPlist": {
      "ITSAppUsesNonExemptEncryption": false
    }
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
    plugins: ['expo-router', 'expo-localization', 'expo-web-browser', 'expo-audio'],
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
        projectId: '804c3e23-d136-4f76-81b4-c0ec5ba01117',
      },
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
    updates: {
      url: 'https://u.expo.dev/804c3e23-d136-4f76-81b4-c0ec5ba01117',
    },
  },
}
