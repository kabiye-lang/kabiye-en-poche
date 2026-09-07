import type { LessonExample } from '../../types/lesson-steps'

import { ScrollView } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'

import { router } from 'expo-router'

import { useLingui } from '@lingui/react/macro'

import { useAppAlphabetLetters } from '../../hooks/use-app-data'
import { useLanguage } from '../../hooks/use-language'
import { usableAudioUrl } from '../../utils/audio-source'
import { SpeakerSlashIcon } from '../icons'
import { Button, Text, View } from '../ui'

/** The letters French cannot write. Only these earn a chip. */
const KABIYE_ONLY = 'ɖƉɛƐɣƔɩƖŋŊɔƆʋƲñÑ'

interface TeachStepProps {
  example: LessonExample
  onContinue: () => void
}

/**
 * One word, on its own screen, before the learner is asked to do anything with it.
 *
 * The lesson used to open with three essays of continuous prose covering a dozen words
 * at once, then run a flat list of exercises. A learner met `sɛtʋ` in the middle of a
 * paragraph and was asked to spell it eleven screens later. Laterite pairs them: this
 * card, then immediately a question about this word.
 *
 * The letter chips are not authored. Every letter here that French cannot write is
 * looked up in `alphabet_letters`, whose `pronunciation_*` column already holds exactly
 * the phrase the chip needs -- "Like 'ng' in 'sing'" for ŋ. The hardest-looking element
 * on the card is the one that costs nothing to fill.
 */
const TeachStep = ({ example, onContinue }: TeachStepProps) => {
  const { t } = useLingui()
  const { currentLanguage, getValue } = useLanguage()
  const { data: letters } = useAppAlphabetLetters()

  const gloss = currentLanguage === 'fr' ? example.fr : example.en
  const note = example.note?.[currentLanguage] ?? example.note?.en

  // One chip per distinct Kabiyè-only letter in the word, in the order they appear.
  const chips = [...new Set([...example.kbp].filter((ch) => KABIYE_ONLY.includes(ch)))]
    .map((ch) => {
      const row = letters?.find((l) => l.id === ch || l.id === ch.toLowerCase())
      const hint = row ? getValue(row, 'pronunciation') : null
      return hint ? { letter: ch, hint } : null
    })
    .filter((c): c is { letter: string; hint: string } => c !== null)

  const audio = usableAudioUrl(example.audio_url)

  return (
    <View className="bg-background flex-1">
      <ScrollView contentContainerClassName="px-6 pb-8 pt-8" showsVerticalScrollIndicator={false}>
        <Text className="text-accent text-[13px] font-semibold uppercase tracking-[0.1em]">{t`New word`}</Text>

        <Animated.View entering={FadeInDown.duration(600)}>
          <Text kabiye weight="bold" className="text-foreground mt-3 text-[44px] leading-[1.05]">
            {example.kbp}
          </Text>
          {gloss ? <Text className="text-foreground mt-1 text-[24px] leading-[1.2]">{gloss}</Text> : null}
        </Animated.View>

        <View className="border-foreground my-6 border-t-[1.5px]" />

        {note ? <Text className="text-foreground text-[17px] leading-[1.5]">{note}</Text> : null}

        {example.pronunciation ? (
          <Text className="text-foreground-secondary mt-3 text-[15px]">
            {t`Said`}{' '}
            <Text kabiye className="text-foreground-secondary text-[15px]">
              {example.pronunciation}
            </Text>
          </Text>
        ) : null}

        {chips.length > 0 ? (
          <View className="mt-6 flex-row flex-wrap gap-3">
            {chips.map((chip) => (
              <View
                key={chip.letter}
                className="border-foreground flex-row items-center gap-2 rounded-[10px] border-[1.5px] px-3 py-2"
              >
                <Text kabiye className="text-accent text-[22px]" weight="bold">
                  {chip.letter}
                </Text>
                <Text className="text-foreground-secondary max-w-[210px] text-[13px] leading-[1.3]">{chip.hint}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Absence beats a stand-in: the notice appears only when there is no recording,
            and says why rather than showing a control that would play nothing. */}
        {!audio ? (
          <View className="bg-background-tertiary mt-6 flex-row items-start gap-3 rounded-[14px] px-4 py-3">
            <SpeakerSlashIcon size={18} className="text-foreground-secondary mt-[2px]" />
            <Text className="text-foreground-secondary flex-1 text-[14px] leading-[1.4]">
              {t`No recording yet. We show nothing rather than a wrong voice.`}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <View className="flex-row gap-3 px-6 pb-8">
        {example.lexeme_id ? (
          <Button
            variant="outline"
            className="flex-1"
            onPress={() => router.push(`/word/${encodeURIComponent(example.kbp)}`)}
          >
            {t`Entry`}
          </Button>
        ) : null}
        <Button variant="primary" className="flex-[1.4]" onPress={onContinue}>
          {t`Try it`}
        </Button>
      </View>
    </View>
  )
}

export default TeachStep
