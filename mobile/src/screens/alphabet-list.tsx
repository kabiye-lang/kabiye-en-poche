import { useState } from 'react'
import { FlatList, Pressable } from 'react-native'

import { router } from 'expo-router'

import { useLingui } from '@lingui/react/macro'

import { Skeleton, Text, View } from '../components/ui'
import { useAppAlphabetLetters, useAppCmsPage } from '../hooks/use-app-data'

type Filter = 'all' | 'vowels' | 'new'

export default function AlphabetListScreen() {
  const { t } = useLingui()
  const [filter, setFilter] = useState<Filter>('all')
  const { data: alphabetLetters, isLoading, error } = useAppAlphabetLetters()
  const { data: alphabetIntro } = useAppCmsPage('alphabet-introduction')

  if (isLoading) {
    return (
      <View flex className="bg-background px-6 pt-16">
        <Skeleton className="h-11 w-1/2" />
        <View className="mt-8 flex-row flex-wrap gap-2">
          {Array.from({ length: 12 }, (_, tile) => (
            <Skeleton key={tile} className="h-[86px] w-[86px] rounded-xl" />
          ))}
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

  // "New to French" is the reason most of this screen exists: eight of the thirty-two
  // are letters a French reader has never had to write.
  const letters = (alphabetLetters || []).filter((letter) =>
    filter === 'all' ? true : filter === 'vowels' ? letter.type === 'vowel' : KABIYE_ONLY.includes(letter.id)
  )

  return (
    <View flex safeArea="top" className="bg-background">
      <FlatList
        numColumns={4}
        data={letters}
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

            <View className="mt-6 flex-row flex-wrap gap-2">
              {(
                [
                  ['all', t`All`],
                  ['vowels', t`Vowels`],
                  ['new', t`New to French`],
                ] as const
              ).map(([id, label]) => (
                <Pressable
                  key={id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: filter === id }}
                  onPress={() => setFilter(id)}
                  className={
                    filter === id
                      ? 'bg-foreground rounded-full px-[18px] py-2'
                      : 'border-foreground rounded-full border-[1.5px] px-[18px] py-2'
                  }
                >
                  <Text
                    weight="semibold"
                    className={filter === id ? 'text-background text-[15px]' : 'text-foreground text-[15px]'}
                  >
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
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
