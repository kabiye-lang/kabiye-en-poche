import { Asset } from 'expo-asset'

/**
 * A 0.8 s, 440 Hz tone that stands in for every recording -- development builds only, and
 * only with `EXPO_PUBLIC_AUDIO_FIXTURE=1`. It lets the player, the Teach card's button and
 * the listening exercises be exercised in a simulator before any real recording exists.
 *
 * It is a tone on purpose, never speech: we do not fabricate pronunciation, not even as a
 * placeholder.
 *
 * Release builds never see it. Metro inlines `__DEV__` as `false` and folds the dead
 * branch before collecting dependencies, so the `require` (and the asset) is not bundled.
 */
export const DEV_AUDIO_FIXTURE_URI: string | undefined =
  __DEV__ && process.env.EXPO_PUBLIC_AUDIO_FIXTURE === '1'
    ? Asset.fromModule(require('../../assets/audio/dev-fixture-tone.m4a')).uri
    : undefined
