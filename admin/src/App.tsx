import { Admin, mergeTranslations, Resource, bwLightTheme } from 'react-admin'
import { BrowserRouter } from 'react-router-dom'

import { deepmerge } from '@mui/utils'
import { QueryClient } from '@tanstack/react-query'
import polyglotI18nProvider from 'ra-i18n-polyglot'
import englishMessages from 'ra-language-english'
import { raSupabaseEnglishMessages } from 'ra-supabase'

import { LoginPage } from '@/auth/login-page'

import { authProvider } from './auth-provider'
import { dataProvider } from './data-provider'
import Layout from './layout'
import { Dashboard } from './dashboard/dashboard'

import alphabetLetters from './resources/alphabet-letters'
import audios from './resources/audios'
import categories from './resources/categories'
import cmsPages from './resources/cms-pages'
import lessonActivities from './resources/lesson-activities'
import lessonContents from './resources/lesson-contents'
import lessons from './resources/lessons'
import topics from './resources/topics'
import units from './resources/units'

const queryClient = new QueryClient()
const i18nProvider = polyglotI18nProvider(
  () => mergeTranslations(englishMessages, raSupabaseEnglishMessages),
  'en'
)

const myLightTheme = deepmerge(bwLightTheme, {
  palette: {
    background: {
      default: '#fafafb',
    },
  },
})

const App = () => (
  <BrowserRouter basename="/">
    <Admin
      dataProvider={dataProvider}
      authProvider={authProvider}
      i18nProvider={i18nProvider}
      layout={Layout}
      dashboard={Dashboard}
      loginPage={LoginPage}
      queryClient={queryClient}
      theme={myLightTheme}
    >
      <Resource name="units" {...units} />
      <Resource name="lessons" {...lessons} />
      <Resource name="lesson_contents" {...lessonContents} />
      <Resource name="lesson_activities" {...lessonActivities} />
      <Resource name="alphabet_letters" {...alphabetLetters} />
      <Resource name="audios" {...audios} />
      <Resource name="cms_pages" {...cmsPages} />
      <Resource name="categories" {...categories} />
      <Resource name="topics" {...topics} />
    </Admin>
  </BrowserRouter>
)

export default App
