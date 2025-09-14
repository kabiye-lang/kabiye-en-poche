module.exports = function (api) {
  api.cache(true)
  return {
    plugins: ['babel-plugin-react-compiler', '@lingui/babel-plugin-lingui-macro'],
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
  }
}
