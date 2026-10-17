// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config')
const { withUniwindConfig } = require('uniwind/metro')

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // [Web-only]: Enables CSS support in Metro.
  isCSSEnabled: true,
})

const { transformer, resolver } = config

config.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve('@lingui/metro-transformer/expo'),
}
config.resolver = {
  ...resolver,
  sourceExts: [...resolver.sourceExts, 'po', 'pot'],
}

// Expo's resolver, kept before uniwind wraps it (undefined means Metro's default).
const expoResolveRequest = config.resolver.resolveRequest

const uniwindConfig = withUniwindConfig(config, {
  cssEntryFile: './src/global.css',
  polyfills: {
    rem: 14,
  },
})

// uniwind redirects every `react-native` import to its own components/index.js, a fixed
// export list without `AssetRegistry`. RN 0.88 made `AssetRegistry` a public `react-native`
// export and expo-asset 58 imports it from there, so the app crashed at launch with
// "Cannot read property 'getAssetByID' of undefined" (expo-font -> expo-asset).
// expo-asset is the only runtime importer of it, so only its import skips uniwind.
// https://github.com/uni-stack/uniwind/issues/732
// Delete when uniwind's components/index.js exports AssetRegistry.
const uniwindResolveRequest = uniwindConfig.resolver.resolveRequest
const EXPO_ASSET = /[/\\]node_modules[/\\]expo-asset[/\\]/
uniwindConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native' && EXPO_ASSET.test(context.originModulePath)) {
    return (expoResolveRequest ?? context.resolveRequest)(context, moduleName, platform)
  }
  return uniwindResolveRequest(context, moduleName, platform)
}

module.exports = uniwindConfig
