import type { MyWord } from '../../hooks/use-my-words'

import { useCallback, useState } from 'react'
import { Pressable, ScrollView } from 'react-native'

import { router, useFocusEffect } from 'expo-router'

import { useLingui } from '@lingui/react/macro'

import { PencilSimpleIcon } from '../../components/icons'
import { Text, View } from '../../components/ui'
import { useMyWords } from '../../hooks/use-my-words'

type Sort = 'recent' | 'alpha' | 'practise'

/**
 * Every word this learner has met, and whether they have written it.
 *
 * The pencil is the whole point of the list: filled means written correctly at least
 * once, outline means met but not yet written. That distinction is what the app is for
 * -- one of its three audiences already speaks Kabiyè and is here to learn the
 * orthography -- so it earns the trailing position on every row.
 */
const MyWordsScreen = () => {
  const { t } = useLingui()
  const { words, isLoading, refresh } = useMyWords()
  const [sort, setSort] = useState<Sort>('recent')

  // Re-read on every focus, not just on mount. This screen is pushed, so returning to
  // it reuses the mounted instance and the mount effect never runs again -- a word added
  // from a dictionary entry showed up in Profile's count but not in this list.
  useFocusEffect(
    useCallback(() => {
      void refresh()
    }, [refresh])
  )

  const sorted = sortWords(words, sort)
  const unwritten = words.filter((word) => word.writtenCount === 0)

  return (
    <View flex safeArea="top" className="bg-background">
      {/* `flex-1`, or the ScrollView grows to its content and the footer button
          below it draws over the last rows instead of under them. */}
      <ScrollView className="flex-1" contentContainerClassName="px-6 pb-8 pt-14" showsVerticalScrollIndicator={false}>
        <Text className="text-accent text-[13px] font-semibold uppercase tracking-[0.1em]">{t`My words`}</Text>
        <Text weight="semibold" className="text-foreground mt-2 text-[40px] leading-[1.0]">
          {words.length === 1 ? t`1 word` : t`${words.length} words`}
        </Text>

        <View className="mt-5 flex-row flex-wrap gap-2">
          {(
            [
              ['recent', t`Recent`],
              ['alpha', t`A–Z`],
              ['practise', t`To practise`],
            ] as const
          ).map(([id, label]) => (
            <Pressable
              key={id}
              accessibilityRole="button"
              accessibilityState={{ selected: sort === id }}
              onPress={() => setSort(id)}
              className={
                sort === id
                  ? 'bg-foreground rounded-full px-[18px] py-2'
                  : 'border-foreground rounded-full border-[1.5px] px-[18px] py-2'
              }
            >
              <Text
                weight="semibold"
                className={sort === id ? 'text-background text-[15px]' : 'text-foreground text-[15px]'}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        {isLoading ? null : words.length === 0 ? (
          <View className="border-foreground mt-8 rounded-[18px] border-[1.5px] p-6">
            <Text className="text-foreground text-[17px] leading-[1.5]">
              {t`No words yet. Finish a lesson, or bookmark a word from the dictionary, and it will appear here.`}
            </Text>
          </View>
        ) : (
          <View className="mt-6">
            {sorted.map((word, i) => (
              <Pressable
                key={word.headword}
                accessibilityRole="link"
                accessibilityLabel={
                  word.writtenCount > 0 ? `${word.headword}, ${t`written`}` : `${word.headword}, ${t`not written yet`}`
                }
                onPress={() => router.push(`/word/${encodeURIComponent(word.headword)}`)}
                className={
                  i === 0
                    ? 'flex-row items-center justify-between py-4'
                    : 'border-border flex-row items-center justify-between border-t py-4'
                }
              >
                <Text kabiye weight="bold" className="text-foreground flex-1 text-[24px]">
                  {word.headword}
                </Text>
                <PencilSimpleIcon
                  size={18}
                  weight={word.writtenCount > 0 ? 'fill' : 'regular'}
                  className={word.writtenCount > 0 ? 'text-foreground' : 'text-border'}
                />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {unwritten.length > 0 ? (
        <View className="px-6 pb-8">
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(tabs)/learn')}
            className="bg-foreground items-center rounded-full px-6 py-[18px]"
          >
            <Text weight="semibold" className="text-background text-[17px]">
              {unwritten.length === 1 ? t`Practise the 1 unwritten` : t`Practise the ${unwritten.length} unwritten`}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  )
}

/** Recent first, alphabetical, or the ones still to write. */
export function sortWords(words: MyWord[], sort: Sort): MyWord[] {
  if (sort === 'alpha') {
    return [...words].sort((a, b) => a.headword.localeCompare(b.headword))
  }
  if (sort === 'practise') {
    // Unwritten first; within each group, most recently met first.
    return [...words].sort((a, b) => {
      const byWritten = Number(a.writtenCount > 0) - Number(b.writtenCount > 0)
      return byWritten !== 0 ? byWritten : b.firstSeen.localeCompare(a.firstSeen)
    })
  }
  return [...words].sort((a, b) => b.firstSeen.localeCompare(a.firstSeen))
}

export default MyWordsScreen
