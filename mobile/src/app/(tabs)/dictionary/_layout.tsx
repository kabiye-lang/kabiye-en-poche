import { Stack } from 'expo-router'

import { useLingui } from '@lingui/react/macro'

export default function TabDictionaryLayout() {
  const { t } = useLingui()

  return (
    <Stack>
      {/* No native header. The screen states its own title at 40px with a laterite
          label above it, so a second "Dictionary" in the nav bar said the same thing
          twice and stole the top 44px from the count that is the point of the page.
          The PDF link lives in the pill row instead. */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="search"
        options={{
          title: t`Search Results`,
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <Stack.Screen
        name="my-words"
        options={{
          title: t`My words`,
          headerBackButtonDisplayMode: 'minimal',
          headerBackTitle: '',
          headerTransparent: true,
          headerTitle: '',
        }}
      />
      <Stack.Screen
        name="pdf"
        options={{
          title: t`PDF Dictionary`,
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <Stack.Screen
        name="letter/[letter]"
        options={{
          title: t`Browse by Letter`,
          headerBackButtonDisplayMode: 'minimal',
          headerBackTitle: '',
          headerTransparent: true,
        }}
      />
    </Stack>
  )
}
