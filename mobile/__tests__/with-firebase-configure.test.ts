import { addFirebaseConfigure } from '../plugins/with-firebase-configure'

// The SDK 58 AppDelegate.swift as `expo prebuild` writes it (invertase issue #9331), before
// any Firebase plugin runs.
const SDK58_APP_DELEGATE = `internal import Expo
import React
import ReactAppDependencyProvider

@main
class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {
  var window: UIWindow?

  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    // The window is created and React Native is started by \`SceneDelegate\` under the
    // scene-based life cycle (required by the iOS 27 SDK).
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}
`

const count = (text: string, needle: string) => text.split(needle).length - 1

describe('addFirebaseConfigure', () => {
  it('inserts the import and one configure() call above the return, indented to match', () => {
    const out = addFirebaseConfigure(SDK58_APP_DELEGATE)

    expect(count(out, 'FirebaseApp.configure()')).toBe(1)
    expect(count(out, 'import FirebaseCore')).toBe(1)
    expect(out).toContain('internal import Expo\nimport FirebaseCore\n')
    expect(out).toContain(
      '    FirebaseApp.configure()\n    return super.application(application, didFinishLaunchingWithOptions: launchOptions)'
    )
  })

  it('changes nothing on a second run', () => {
    const once = addFirebaseConfigure(SDK58_APP_DELEGATE)
    expect(addFirebaseConfigure(once)).toBe(once)
  })

  it('does not add the import twice when RNFB already added it', () => {
    const withImport = SDK58_APP_DELEGATE.replace(
      'internal import Expo\n',
      'internal import Expo\nimport FirebaseCore\n'
    )
    const out = addFirebaseConfigure(withImport)

    expect(count(out, 'import FirebaseCore')).toBe(1)
    expect(count(out, 'FirebaseApp.configure()')).toBe(1)
  })

  it('throws, naming the file, when the return anchor is missing', () => {
    const noAnchor = SDK58_APP_DELEGATE.replace(
      'return super.application(application, didFinishLaunchingWithOptions: launchOptions)',
      'return true'
    )
    expect(() => addFirebaseConfigure(noAnchor, 'ios/App/AppDelegate.swift')).toThrow('ios/App/AppDelegate.swift')
  })
})
