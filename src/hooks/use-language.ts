import { useLingui } from '@lingui/react/macro'

/**
 * Hook to get the current language and utilities for language-specific content
 */
export function useLanguage() {
  const { i18n } = useLingui()
  const currentLanguage = i18n.locale as 'en' | 'fr'
  const isFrench = currentLanguage === 'fr'
  const isEnglish = currentLanguage === 'en'

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
  const getValue = <T extends Record<string, any>>(obj: T | null | undefined, field: string): string | null => {
    if (!obj) return null
    const fieldName = getField(field)
    return obj[fieldName] ?? null
  }

  /**
   * Get array value based on current language
   */
  const getArrayValue = <T extends Record<string, any>>(obj: T | null | undefined, field: string): string[] | null => {
    if (!obj) return null
    const fieldName = getField(field)
    const value = obj[fieldName]
    return Array.isArray(value) ? value : null
  }

  /**
   * Get JSON value based on current language
   */
  const getJsonValue = <T extends Record<string, any>, R = any>(obj: T | null | undefined, field: string): R | null => {
    if (!obj) return null
    const fieldName = getField(field)
    return obj[fieldName] ?? null
  }

  return {
    currentLanguage,
    isFrench,
    isEnglish,
    getField,
    getValue,
    getArrayValue,
    getJsonValue,
  }
}
