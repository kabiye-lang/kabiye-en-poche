import { ActivityIndicator, FlatList } from 'react-native'

import { router } from 'expo-router'

import Markdown from '@jonasmerlin/react-native-markdown-display'
import { useLingui } from '@lingui/react/macro'

import { Card, ScreenTitle, Text, View } from '@/components/ui'
import { useAppAlphabetLetters, useAppCmsPage } from '@/hooks/use-app-data'
import { LETTER_TYPE_COLORS, MARKDOWN_STYLE } from '@/utils/design-system-nativewind'

export default function AlphabetListScreen() {
  const { t } = useLingui()
  const { data: alphabetLetters, isLoading, error } = useAppAlphabetLetters()
  const { data: alphabetIntro } = useAppCmsPage('alphabet-introduction')

  if (isLoading) {
    return (
      <View flex className="bg-white dark:bg-gray-900">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" className="text-primary" />
          <Text className="mt-4">{t`Loading alphabet...`}</Text>
        </View>
      </View>
    )
  }

  if (error) {
    return (
      <View flex className="bg-white dark:bg-gray-900">
        <View className="flex-1 items-center justify-center px-4">
          <Text variant="h6" className="text-primary text-center">
            {t`Error loading alphabet`}
          </Text>
          <Text variant="caption" className="text-text-grey mt-2 text-center dark:text-gray-400">
            {error.message}
          </Text>
        </View>
      </View>
    )
  }
  return (
    <View flex className="bg-white dark:bg-gray-900">
      <FlatList
        numColumns={3}
        data={alphabetLetters || []}
        contentContainerStyle={{ paddingHorizontal: 15, gap: 5, paddingBottom: 20 }}
        columnWrapperStyle={{ maxWidth: '33.33%', gap: 5 }}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={() => (
          <>
            <ScreenTitle title={alphabetIntro?.title_en || t`I learn the Kabiyè Alphabet`} />
            {alphabetIntro && (
              <View>
                <Markdown style={MARKDOWN_STYLE}>{alphabetIntro.content_en}</Markdown>
              </View>
            )}
          </>
        )}
        renderItem={({ item }) => (
          <View className="relative w-full items-center">
            <Card
              className="h-[100px] w-full flex-1 items-center justify-center"
              onPress={() =>
                router.push({
                  pathname: '/alphabet/[letter]',
                  params: { letter: item.id },
                })
              }
            >
              <View center>
                <Card
                  className="mb-2 rounded-full px-2 py-1"
                  backgroundColor={LETTER_TYPE_COLORS[item.type as keyof typeof LETTER_TYPE_COLORS]}
                >
                  <Text variant="small" weight="medium" className="text-white">
                    {item.type === 'vowel' ? t`Vowel` : item.type === 'consonant' ? t`Consonant` : t`Grapheme`}
                  </Text>
                </Card>

                <Text variant="h2" weight="medium" className="text-center">
                  {item.id}
                </Text>
              </View>
            </Card>
          </View>
        )}
      />
    </View>
  )
}
