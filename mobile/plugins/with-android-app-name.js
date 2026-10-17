/**
 * Sets the Android `app_name` string (the launcher label) to the given name.
 *
 * Why: Expo writes `app_name` from `name` in app.config.ts, and `name` has no è there,
 * because it also names the Xcode target and eas-cli derives that target name with older
 * code than SDK 58's prebuild (see the comment on `name`).
 *
 * Delete this plugin when `name` gets its è back.
 */
const { AndroidConfig, withStringsXml } = require('expo/config-plugins')

module.exports = function withAndroidAppName(config, appName) {
  return withStringsXml(config, (config) => {
    config.modResults = AndroidConfig.Strings.setStringItem(
      [AndroidConfig.Resources.buildResourceItem({ name: 'app_name', value: appName })],
      config.modResults
    )
    return config
  })
}
