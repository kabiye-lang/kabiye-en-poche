import type { LessonExample } from '../../types/lesson-steps'

import Animated, { FadeInDown } from 'react-native-reanimated'

import { useLingui } from '@lingui/react/macro'

import { useAppAlphabetLetters } from '../../hooks/use-app-data'
import { useLanguage } from '../../hooks/use-language'
import { Text, View } from '../ui'

/** The letters French cannot write. Only these earn a chip. */
const KABIYE_ONLY = 'ɖƉɛƐɣƔɩƖŋŊɔƆʋƲñÑ'

interface TeachContentProps {
  example: LessonExample
}

/**
 * The word itself: headword, gloss, note, pronunciation and letter chips -- the
 * presentational half of `TeachStep`, without its "Try it" / "Look it up" controls.
 *
 * Split out so "Show the word again" (review, see `lesson.tsx`) can put the same card in
 * an overlay over a live question. Those two controls stay in `TeachStep` only: "Try it"
 * advances the lesson and "Look it up" leaves it, neither of which the overlay may do
 * while it sits over a question the learner has not answered yet. It never substitutes or
 * explains missing audio -- that notice is said once, the first time a learner meets the
 * word, which stays `TeachStep`'s to own.
 */
const TeachContent = ({ example }: TeachContentProps) => {
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

  return (
    <View>
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
              {/* large-text: 22px bold clears the WCAG large-text threshold (>= 18.66px
                  bold), so `accent` (4.22:1) is the large-glyph carve-out here, not a
                  small-text miss. */}
              <Text kabiye className="text-accent text-[22px]" weight="bold">
                {chip.letter}
              </Text>
              <Text className="text-foreground-secondary max-w-[210px] text-[13px] leading-[1.3]">{chip.hint}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  )
}

export default TeachContent
