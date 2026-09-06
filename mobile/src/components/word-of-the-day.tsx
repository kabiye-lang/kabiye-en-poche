import type { DictionaryEntry } from '../types/dictionary'

import { Pressable } from 'react-native'
import Animated, { FadeInUp } from 'react-native-reanimated'

import { Link } from 'expo-router'

import { useLingui } from '@lingui/react/macro'

import { resolveTranslation } from '../utils/dictionary-helpers'
import { LanguageTag } from './language-tag'
import { Text, View } from './ui'

type WordGroup = {
  baseHeadword: string
  entries: DictionaryEntry[]
}

type Props = {
  words: WordGroup[]
  language: string
  isLoading?: boolean
  isError?: boolean
}

const WordOfTheDaySkeleton = () => (
  <View className="bg-card rounded-2xl p-4">
    <View className="bg-secondary/20 mb-2 h-6 w-32 rounded" />
    <View className="bg-secondary/10 h-4 w-48 rounded" />
  </View>
)

const WordOfTheDayFallback = () => {
  const { t } = useLingui()
  return (
    <View className="bg-card items-center justify-center rounded-2xl p-4" style={{ minHeight: 64 }}>
      <Text variant="body" className="text-foreground-secondary text-center">
        {t`No word available today`}
      </Text>
    </View>
  )
}

const WordOfTheDayCard = ({ word, language, index }: { word: WordGroup; language: string; index: number }) => {
  const { entries } = word
  const firstEntry = entries[0]
  if (!firstEntry) return null

  // Homographs are distinct entries that can share a spelling, so joining them printed
  // the same word twice ("ñɩŋgbasɩ, ñɩŋgbasɩ"). Only list spellings that actually differ.
  const displayHeadword = [...new Set(entries.map((e) => e.entry_data.headword))].join(', ')

  const gloss = resolveTranslation(
    firstEntry.entry_data.senses[0]?.definitions[0]?.translations,
    language === 'fr' ? 'fr' : 'en'
  )

  return (
    <Animated.View entering={FadeInUp.duration(300).delay(index * 100)}>
      <Link href={`/word/${firstEntry.entry_data.headword}`} asChild>
        <Pressable>
          <View className="bg-card mb-3 rounded-2xl p-4">
            <Text kabiye variant="lg" weight="bold" className="text-foreground">
              {displayHeadword}
            </Text>
            {firstEntry.entry_data.pronunciations?.[0] && (
              <Text kabiye variant="caption" className="text-foreground-secondary mt-1">
                [{firstEntry.entry_data.pronunciations[0]}]
              </Text>
            )}
            {!!gloss.text && (
              <View className="mt-2 flex-row items-baseline gap-2">
                <Text variant="body" className="text-foreground flex-1">
                  {gloss.text}
                </Text>
                {gloss.isFallback && gloss.language && <LanguageTag language={gloss.language} />}
              </View>
            )}
          </View>
        </Pressable>
      </Link>
    </Animated.View>
  )
}

export const WordOfTheDay = ({ words, language, isLoading, isError }: Props) => {
  if (isLoading) return <WordOfTheDaySkeleton />
  if (isError || !words || words.length === 0) return <WordOfTheDayFallback />

  return (
    <>
      {words.map((word, index) => (
        <WordOfTheDayCard key={word.baseHeadword} word={word} language={language} index={index} />
      ))}
    </>
  )
}
