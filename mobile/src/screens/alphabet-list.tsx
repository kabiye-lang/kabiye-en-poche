import { ActivityIndicator, FlatList, Pressable } from 'react-native'

import { router } from 'expo-router'

import { useLingui } from '@lingui/react/macro'

import { Text, View } from '../components/ui'
import { useAppAlphabetLetters, useAppCmsPage } from '../hooks/use-app-data'

export default function AlphabetListScreen() {
  const { t } = useLingui()
  const { data: alphabetLetters, isLoading, error } = useAppAlphabetLetters()
  const { data: alphabetIntro } = useAppCmsPage('alphabet-introduction')

  if (isLoading) {
    return (
      <View flex className="bg-background">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" className="text-primary" />
          <Text className="mt-4">{t`Loading alphabet...`}</Text>
        </View>
      </View>
    )
  }

  if (error) {
    return (
      <View flex className="bg-background">
        <View className="flex-1 items-center justify-center px-4">
          <Text variant="h6" className="text-primary text-center">
            {t`Error loading alphabet`}
          </Text>
          <Text variant="caption" className="text-foreground mt-2 text-center">
            {error.message}
          </Text>
        </View>
      </View>
    )
  }

  // The letters French cannot write. These are the tiles that carry laterite -- the one
  // distinction the app exists to teach, and the only thing on this screen worth an accent.
  const KABIYE_ONLY = 'ɖƉɛƐɣƔɩƖŋŊɔƆʋƲñÑ'

  return (
    <View flex safeArea="top" className="bg-background">
      <FlatList
        numColumns={4}
        data={alphabetLetters || []}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32, gap: 8 }}
        columnWrapperStyle={{ gap: 8 }}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        // pt-14: the stack header is transparent here, so its back button floats over
        // the content and would otherwise sit on the title.
        ListHeaderComponent={() => (
          <View className="pb-6 pt-14">
            <Text className="text-accent text-[13px] font-semibold uppercase tracking-[0.1em]">{t`Alphabet`}</Text>
            <Text weight="semibold" className="text-foreground mt-2 text-[40px] leading-[1.0]">
              {alphabetIntro?.title_en || t`The Kabiyè alphabet`}
            </Text>
            <Text className="text-foreground mt-4 text-[26px] leading-[1.2]">
              {t`32 letters. Eight of them are not on any French keyboard.`}
            </Text>
          </View>
        )}
        renderItem={({ item }) => {
          const isKabiyeOnly = KABIYE_ONLY.includes(item.id)
          return (
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={item.id}
              onPress={() =>
                router.push({
                  pathname: '/alphabet/[letter]',
                  params: { letter: item.id },
                })
              }
              className={
                isKabiyeOnly
                  ? 'bg-accent aspect-square flex-1 items-center justify-center rounded-xl'
                  : 'bg-background-secondary border-border aspect-square flex-1 items-center justify-center rounded-xl border'
              }
            >
              <Text
                kabiye
                weight="bold"
                className={isKabiyeOnly ? 'text-[34px] text-white' : 'text-foreground text-[34px]'}
              >
                {item.id}
              </Text>
              <Text
                className={
                  isKabiyeOnly
                    ? 'absolute bottom-2 text-[9px] uppercase tracking-[0.08em] text-white/60'
                    : 'text-foreground-secondary/60 absolute bottom-2 text-[9px] uppercase tracking-[0.08em]'
                }
              >
                {item.type === 'vowel' ? t`Vowel` : item.type === 'consonant' ? t`Consonant` : t`Grapheme`}
              </Text>
            </Pressable>
          )
        }}
      />
    </View>
  )
}
