const pkg = require('./package.json')

// Use the data from `eas metadata:pull`
const config = require('./store.config.json')

module.exports = async () => {
  // Edit config here if needed
  config.apple.version = pkg.version
  return config
}
