import { Pressable } from 'react-native'

import { Link, Stack } from 'expo-router'

import { useLingui } from '@lingui/react/macro'

import { FilePdfIcon } from '../../../components/icons'
import { Text } from '../../../components/ui'

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
              <Pressable className="flex flex-row items-center justify-center gap-1 !px-0 !py-0">
                {({ pressed }) => (
                  <>
                    <FilePdfIcon
                      size={20}
                      weight="light"
                      className="text-primary"
                      style={{ opacity: pressed ? 0.5 : 1 }}
                    />
                    <Text
                      variant="caption"
                      weight="medium"
                      className="text-primary"
                      style={{ opacity: pressed ? 0.5 : 1 }}
                    >
                      PDF
                    </Text>
                  </>
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
