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
