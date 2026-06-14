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

  return {
    currentLanguage,
    getField,
    getValue,
    getArrayValue,
    getJsonValue,
  }
}
