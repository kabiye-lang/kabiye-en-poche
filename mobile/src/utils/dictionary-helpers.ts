import type { DictionaryEntry } from '../types/dictionary'

/**
 * Check if a dictionary entry is a redirect entry
 * @param entry - The dictionary entry to check
 * @returns true if the entry has a mainEntry field (indicating it's a redirect)
 */
export function isRedirectEntry(entry: DictionaryEntry): boolean {
  return !!entry.entry_data.mainEntry
}

/**
 * Get the main entry headword from a redirect entry
 * @param entry - The dictionary entry
 * @returns The main entry headword if it exists, undefined otherwise
 */
export function getMainEntryHeadword(entry: DictionaryEntry): string | undefined {
  return entry.entry_data.mainEntry
}

/**
 * Pick a definition in the reader's language, falling back to the other one.
 *
 * Not every entry is glossed in both languages: the Webonary crawl carries English for
 * about 77% of entries, and the 585 entries whose definition comes from the print
 * dictionary's French->Kabiyè half are French-only. Reading `translations[language]`
 * directly therefore renders an empty string for a meaningful share of the dictionary —
 * Word of the Day showed a Kabiyè headword with nothing under it.
 *
 * A gloss in the other language is far more useful than a blank, so fall back rather
 * than hide the entry.
 */
export function translationFor(
  translations: { fr?: string | null; en?: string | null } | null | undefined,
  language: 'fr' | 'en',
  fallbackText = ''
): string {
  return resolveTranslation(translations, language, fallbackText).text
}

export interface ResolvedTranslation {
  text: string
  /** The language the text is actually in, or undefined when the fallback text was used. */
  language?: 'fr' | 'en'
  /** True when the gloss had to come from the other language. */
  isFallback: boolean
}

/**
 * As `translationFor`, but says which language the answer came from.
 *
 * Falling back silently means an English reader is shown French with no hint that it is
 * French -- Word of the Day rendered `fɛŋgɛ / léger(ère) sans poids` with nothing to
 * explain it. Callers use `isFallback` to mark the gloss instead of hiding the entry.
 */
export function resolveTranslation(
  translations: { fr?: string | null; en?: string | null } | null | undefined,
  language: 'fr' | 'en',
  fallbackText = ''
): ResolvedTranslation {
  if (!translations) return { text: fallbackText, isFallback: false }

  const preferred = language === 'fr' ? translations.fr : translations.en
  if (preferred?.trim()) return { text: preferred, language, isFallback: false }

  const otherLanguage = language === 'fr' ? 'en' : 'fr'
  const other = language === 'fr' ? translations.en : translations.fr
  if (other?.trim()) return { text: other, language: otherLanguage, isFallback: true }

  return { text: fallbackText, isFallback: false }
}
