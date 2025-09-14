import type { LanguageDetectorAsyncModule } from 'i18next'

import { initReactI18next } from 'react-i18next'

import * as Localization from 'expo-localization'

import AsyncStorage from '@react-native-async-storage/async-storage'
import i18n from 'i18next'

import translationEn from './i18n/en/translation.json'
import translation from './i18n/fr/translation.json'

export const defaultNS = 'translation'
export const resources = {
  fr: {
    translation,
  },
  en: {
    translation: translationEn,
  },
} as const

// http://i18next.com/docs/ownplugin/#languagedetector
const languageDetector: LanguageDetectorAsyncModule = {
  type: 'languageDetector',
  async: true, // async detection
  detect: async (
    callback: (_lng: string | readonly string[] | undefined) => void | undefined
  ): Promise<string | readonly string[] | undefined> => {
    try {
      await AsyncStorage.getItem('user-language').then((language) => {
        if (language) {
          return callback(language)
        }
        // We will get back a string like "en-US".
        console.log(Localization.getLocales()[0]?.languageCode || 'en')
        return callback(Localization.getLocales()[0]?.languageCode || 'en')
      })
    } catch (error) {
      // @ts-expect-error Type 'void | undefined' is not assignable to type 'string | readonly string[] | undefined'.
      return callback(Localization.getLocales()[0]?.languageCode || 'en')
    }
  },
  //   init: () => {},
  async cacheUserLanguage(language: string) {
    try {
      await AsyncStorage.setItem('user-language', language)
    } catch (error) {
      console.error(error)
    }
  },
}

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .use(languageDetector)
  .init({
    fallbackLng: 'en',
    resources,
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  })

export default i18n
