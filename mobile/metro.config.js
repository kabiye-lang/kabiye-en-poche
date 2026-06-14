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

module.exports = withUniwindConfig(config, {
  cssEntryFile: './src/global.css',
  polyfills: {
    rem: 14,
  },
})
