import { setAudioModeAsync } from 'expo-audio'

let configured: Promise<void> | undefined

/**
 * Put the audio session in playback mode, once.
 *
 * Nothing called this before, so iOS kept its default `.soloAmbient` category and the
 * ring/silent switch muted every recording: a learner with the phone on silent tapped the
 * button and heard nothing. A pronunciation is what the learner asked for, so it plays in
 * silent mode, like any media app.
 *
 * `duckOthers` lowers a podcast or music for the length of a word and lets it come back:
 * expo-audio deactivates the session (notifying other apps) when playback stops. No
 * background playback and no recording -- the app does neither.
 *
 * Called at app start from the root layout and awaited again before every play, so a
 * clip can never start before the mode is set. A failure is retried on the next call.
 */
export function configureAudioSession(): Promise<void> {
  configured ??= setAudioModeAsync({
    playsInSilentMode: true,
    interruptionMode: 'duckOthers',
    shouldPlayInBackground: false,
    allowsRecording: false,
  }).catch(() => {
    configured = undefined
  })
  return configured
}
