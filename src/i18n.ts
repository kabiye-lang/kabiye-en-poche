import * as Localization from 'expo-localization'

import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'

// Import messages from locales folder
import { messages as enMessages } from './locales/en/messages'
import { messages as frMessages } from './locales/fr/messages'

// Load messages for each locale
i18n.load({
  en: enMessages,
  fr: frMessages,
})

// Get device locale and activate it
const deviceLocale = Localization.getLocales()[0]?.languageCode || 'en'
i18n.activate(deviceLocale)

// Export the I18nProvider for use in the app
export { I18nProvider }
export default i18n
