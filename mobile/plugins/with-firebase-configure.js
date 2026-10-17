/**
 * Inserts `FirebaseApp.configure()` into the SDK 58 `AppDelegate.swift`.
 *
 * Why: `@react-native-firebase/app` (26.x) finds its insertion point by matching
 * `self.moduleName = "..."` or `factory.startReactNative(`. The SDK 58 template starts
 * React Native from `SceneDelegate`, so neither line exists. Prebuild then logs "Unable to
 * determine correct Firebase insertion point in AppDelegate.swift" and leaves the call
 * out, and Firebase is never configured at launch.
 * Upstream fix: https://github.com/invertase/react-native-firebase/pull/9336 (merged, not
 * released when this was written).
 *
 * Delete this plugin when `@react-native-firebase/app` ships the fix (check its prebuild
 * output no longer warns).
 *
 * Register it after '@react-native-firebase/app' in app.config.ts. It is safe in either
 * mod order: when `FirebaseApp.configure()` is already present it changes nothing, since a
 * second `configure()` call throws at launch.
 */
const { withAppDelegate } = require('expo/config-plugins')

const CONFIGURE = 'FirebaseApp.configure()'
const IMPORT = 'import FirebaseCore'
const ANCHOR = /^([ \t]*)return super\.application\(application, didFinishLaunchingWithOptions: launchOptions\)/m

/**
 * Adds `import FirebaseCore` (once) and `FirebaseApp.configure()` on its own line right
 * above `return super.application(...)` in `didFinishLaunchingWithOptions`.
 * Throws when that line is missing: a silent skip is the bug this plugin exists to prevent.
 */
function addFirebaseConfigure(contents, fileName = 'AppDelegate.swift') {
  if (contents.includes(CONFIGURE)) return contents

  const anchor = ANCHOR.exec(contents)
  if (!anchor) {
    throw new Error(
      `with-firebase-configure: cannot find "return super.application(application, didFinishLaunchingWithOptions: launchOptions)" in ${fileName}, so FirebaseApp.configure() cannot be inserted.`
    )
  }
  let result = contents.slice(0, anchor.index) + `${anchor[1]}${CONFIGURE}\n` + contents.slice(anchor.index)

  if (!new RegExp(`^${IMPORT}$`, 'm').test(result)) {
    // After the Expo import, as RNFB does; at the top when there is none.
    const expoImport = /^.*import Expo$/m.exec(result)
    result = expoImport
      ? result.slice(0, expoImport.index + expoImport[0].length) +
        `\n${IMPORT}` +
        result.slice(expoImport.index + expoImport[0].length)
      : `${IMPORT}\n${result}`
  }
  return result
}

const withFirebaseConfigure = (config) =>
  withAppDelegate(config, (cfg) => {
    // Objective-C app delegates still match RNFB's own anchors: leave them alone.
    if (cfg.modResults.language === 'swift') {
      cfg.modResults.contents = addFirebaseConfigure(cfg.modResults.contents, cfg.modResults.path)
    }
    return cfg
  })

withFirebaseConfigure.addFirebaseConfigure = addFirebaseConfigure

module.exports = withFirebaseConfigure
