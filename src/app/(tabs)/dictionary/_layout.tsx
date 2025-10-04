import { Pressable } from 'react-native'

import { Link, Stack } from 'expo-router'

import { useLingui } from '@lingui/react/macro'
import { FilePdfIcon } from 'phosphor-react-native'

export default function TabDictionaryLayout() {
  const { t } = useLingui()

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          title: t`Dictionary`,
          headerRight: () => (
            <Link href="/dictionary/pdf" asChild>
              <Pressable className="flex flex-col items-center justify-center !px-0 !py-0">
                {({ pressed }) => (
                  <FilePdfIcon
                    size={24}
                    weight="light"
                    className="text-primary"
                    style={{ opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
      <Stack.Screen
        name="search"
        options={{
          title: t`Search Results`,
          headerBackButtonDisplayMode: 'minimal',
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
