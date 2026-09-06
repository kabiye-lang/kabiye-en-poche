import Constants from 'expo-constants'

/**
 * Every audio URL that shipped with the lesson content was a stand-in: 251 of the
 * 253 example recordings pointed at the same stock piano clip on
 * audio-samples.github.io, and the two that didn't were dead links. Playing them
 * means a learner taps "hear pronunciation" for `afa` and hears music -- worse
 * than silence, because it teaches a pronunciation that is simply wrong.
 *
 * Until real recordings exist (see SPEC-audio.md in the pipeline repo), the only
 * audio we trust is audio we host. Anything else is treated as absent, so the UI
 * hides the affordance instead of lying about it. Recordings uploaded to our
 * storage bucket start working with no further code change.
 */

const supabaseUrl: string | undefined =
  Constants.expoConfig?.extra?.supabase?.url || process.env.EXPO_PUBLIC_SUPABASE_URL

const trustedOrigin = (() => {
  if (!supabaseUrl) return undefined
  try {
    return new URL(supabaseUrl).origin
  } catch {
    return undefined
  }
})()

/**
 * Returns the URL if it is a recording we host, otherwise undefined.
 * Callers treat undefined as "no audio for this item".
 */
export function usableAudioUrl(url?: string | null): string | undefined {
  if (!url || !trustedOrigin) return undefined
  try {
    return new URL(url).origin === trustedOrigin ? url : undefined
  } catch {
    return undefined
  }
}

/** True when at least one item in the list has audio we can actually play. */
export function hasUsableAudio(urls: (string | null | undefined)[]): boolean {
  return urls.some((u) => usableAudioUrl(u) !== undefined)
}
