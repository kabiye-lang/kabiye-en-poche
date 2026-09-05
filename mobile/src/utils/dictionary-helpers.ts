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
  fallbackText = '',
): string {
  if (!translations) return fallbackText
  const preferred = language === 'fr' ? translations.fr : translations.en
  if (preferred?.trim()) return preferred
  const other = language === 'fr' ? translations.en : translations.fr
  return other?.trim() ? other : fallbackText
}
