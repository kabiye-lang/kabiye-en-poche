import * as Localization from 'expo-localization'

import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'

// Import messages from locales folder
import { messages as enMessages } from './locales/en/messages.po'
import { messages as frMessages } from './locales/fr/messages.po'

// Load messages for each locale
i18n.load({
  en: enMessages,
  fr: frMessages,
})

// Get device locale and activate it, defaulting to French
const deviceLocale = Localization.getLocales()[0]?.languageCode || 'fr'
// Only use English or French, default to French for any other language
const supportedLocale = deviceLocale === 'en' ? 'en' : 'fr'
console.log('Supported locale:', supportedLocale)
i18n.activate(supportedLocale)

// Export the I18nProvider for use in the app
export { I18nProvider }
export default i18n
