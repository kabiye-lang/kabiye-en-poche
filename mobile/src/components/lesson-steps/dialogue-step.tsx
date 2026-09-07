import type { LessonExample } from '../../types/lesson-steps'

import { ScrollView } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'

import { useLingui } from '@lingui/react/macro'

import { useLanguage } from '../../hooks/use-language'
import { Button, Text, View } from '../ui'

interface DialogueStepProps {
  title: string
  /** The scene, in the reader's language: where this is happening and between whom. */
  scene?: string
  turns: LessonExample[]
  onContinue: () => void
}

/**
 * A short exchange set in a real situation, read before any word is taught.
 *
 * Learned from the Peace Corps workbook, whose every lesson opens this way: the learner
 * hears the words doing their job before being asked to hold them one at a time. Turns
 * alternate sides so two speakers read as two people. Kabiyè in the face that draws it,
 * the translation quieter beneath; the tone stays inside its brackets.
 */
const DialogueStep = ({ title, scene, turns, onContinue }: DialogueStepProps) => {
  const { t } = useLingui()
  const { currentLanguage } = useLanguage()
  const gloss = (turn: LessonExample) => (currentLanguage === 'fr' ? turn.fr : turn.en) || turn.fr || turn.en

  return (
    <View className="bg-background flex-1">
      <ScrollView className="flex-1" contentContainerClassName="px-6 pb-6 pt-8" showsVerticalScrollIndicator={false}>
        <Text className="text-accent text-[13px] font-semibold uppercase tracking-[0.1em]">{t`Dialogue`}</Text>
        <Animated.View entering={FadeInDown.duration(600)}>
          <Text weight="semibold" className="text-foreground mt-3 text-[26px] leading-[1.15]">
            {title}
          </Text>
          {scene ? <Text className="text-foreground-secondary mt-3 text-[15px] leading-[1.5]">{scene}</Text> : null}
        </Animated.View>

        <View className="mt-8 gap-4">
          {turns.map((turn, i) => {
            const right = i % 2 === 1
            return (
              <View key={`${i}-${turn.kbp}`} className={right ? 'items-end' : 'items-start'}>
                <View
                  className={
                    right
                      ? 'bg-foreground max-w-[88%] rounded-[18px] rounded-tr-[6px] px-4 py-3'
                      : 'border-foreground max-w-[88%] rounded-[18px] rounded-tl-[6px] border-[1.5px] px-4 py-3'
                  }
                >
                  <Text
                    kabiye
                    weight="semibold"
                    className={right ? 'text-background text-[19px]' : 'text-foreground text-[19px]'}
                  >
                    {turn.kbp}
                  </Text>
                  {turn.pronunciation ? (
                    <Text
                      kabiye
                      className={
                        right ? 'text-background/70 mt-0.5 text-[13px]' : 'text-foreground-secondary mt-0.5 text-[13px]'
                      }
                    >
                      {turn.pronunciation}
                    </Text>
                  ) : null}
                  <Text
                    className={
                      right ? 'text-background/80 mt-1.5 text-[14px]' : 'text-foreground-secondary mt-1.5 text-[14px]'
                    }
                  >
                    {gloss(turn)}
                  </Text>
                </View>
              </View>
            )
          })}
        </View>
      </ScrollView>

      <View className="px-6 pb-8">
        <Button variant="primary" fullWidth onPress={onContinue}>
          {t`Continue`}
        </Button>
      </View>
    </View>
  )
}

export default DialogueStep
