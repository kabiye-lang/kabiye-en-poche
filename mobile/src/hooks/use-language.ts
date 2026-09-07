import { useLingui } from '@lingui/react/macro'

/**
 * Hook to get the current language and utilities for language-specific content
 */
export function useLanguage() {
  const { i18n } = useLingui()
  const currentLanguage = i18n.locale as 'en' | 'fr'

  /**
   * Get the appropriate field name based on current language
   * @param baseField - The base field name without language suffix (e.g., 'title', 'content')
   * @returns The field name with language suffix (e.g., 'title_fr', 'title_en')
   */
  const getField = (baseField: string): string => {
    return `${baseField}_${currentLanguage}`
  }

  /**
   * Get the appropriate value from an object based on current language
   * @param obj - Object containing language-specific fields
   * @param field - The base field name without language suffix
   * @returns The value in the current language, or null if not found
   */
  const getValue = <T extends object>(obj: T | null | undefined, field: string): string | null => {
    if (!obj) return null
    const fieldName = getField(field)
    return ((obj as Record<string, unknown>)[fieldName] as string | undefined) ?? null
  }

  /**
   * Get array value based on current language
   */
  const getArrayValue = <T extends object>(obj: T | null | undefined, field: string): string[] | null => {
    if (!obj) return null
    const fieldName = getField(field)
    const value = (obj as Record<string, unknown>)[fieldName]
    return Array.isArray(value) ? (value as string[]) : null
  }

  /**
   * Get JSON value based on current language
   */
  const getJsonValue = <T extends object, R = unknown>(obj: T | null | undefined, field: string): R | null => {
    if (!obj) return null
    const fieldName = getField(field)
    return ((obj as Record<string, unknown>)[fieldName] as R | undefined) ?? null
  }

  /**
   * Read a localised field written either way.
   *
   * Two conventions coexist inside `lesson_activities.data`: flat `gloss_en` /
   * `gloss_fr`, which is what the importer wrote and what every row already in the
   * database uses, and nested `gloss: {en, fr}`, which is what the generator emits now.
   * Migrating the old rows would buy nothing; reading both is a few lines, and a step
   * that reads only one silently loses its question -- the Spell step showed "Write the
   * word in Kabiyè" with no word in it.
   */
  const getLocalised = (obj: Record<string, unknown> | null | undefined, field: string): string | undefined => {
    if (!obj) return undefined

    const flat = obj[`${field}_${currentLanguage}`] ?? obj[`${field}_en`] ?? obj[`${field}_fr`]
    if (typeof flat === 'string' && flat) return flat

    const nested = obj[field]
    if (typeof nested === 'string') return nested || undefined
    if (nested && typeof nested === 'object') {
      const byLanguage = nested as Record<string, unknown>
      const value = byLanguage[currentLanguage] ?? byLanguage.en ?? byLanguage.fr
      return typeof value === 'string' && value ? value : undefined
    }
    return undefined
  }

  return {
    currentLanguage,
    getField,
    getValue,
    getArrayValue,
    getJsonValue,
    getLocalised,
  }
}
