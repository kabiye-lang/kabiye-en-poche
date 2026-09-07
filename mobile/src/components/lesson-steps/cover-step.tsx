import type { LessonExample } from '../../types/lesson-steps'

import { ScrollView } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'

import { useLingui } from '@lingui/react/macro'

import { useLanguage } from '../../hooks/use-language'
import { Button, Text, View } from '../ui'

interface CoverStepProps {
  title: string
  description?: string
  unitLabel?: string
  words: LessonExample[]
  onBegin: () => void
}

/**
 * The lesson's promise, on laterite: this is what you will be able to read afterwards.
 *
 * Built from the same word list the finish screen counts, so the two agree by
 * construction rather than by two pieces of code being kept in step.
 */
const CoverStep = ({ title, description, unitLabel, words, onBegin }: CoverStepProps) => {
  const { t } = useLingui()
  const { currentLanguage } = useLanguage()

  return (
    <View className="bg-accent flex-1">
      <ScrollView contentContainerClassName="px-6 pb-8 pt-4" showsVerticalScrollIndicator={false}>
        {unitLabel ? (
          <Text className="text-right text-[13px] font-semibold uppercase tracking-[0.1em] text-white/80">
            {unitLabel}
          </Text>
        ) : null}

        <Animated.View entering={FadeInDown.duration(600)}>
          <Text weight="semibold" className="mt-6 text-[40px] leading-[1.0] text-white">
            {title}
          </Text>
        </Animated.View>

        {description ? (
          <Text className="mt-4 text-[17px] leading-[1.5] text-white/90">{description}</Text>
        ) : null}

        {words.length > 0 ? (
          <>
            <Text className="mt-9 text-[13px] font-semibold uppercase tracking-[0.1em] text-white/70">
              {t`You will meet`}
            </Text>
            <View className="mt-3">
              {words.map((word, i) => (
                <View
                  key={`${word.kbp}-${i}`}
                  className={
                    i === 0
                      ? 'flex-row items-baseline justify-between py-3'
                      : 'flex-row items-baseline justify-between border-t border-white/30 py-3'
                  }
                >
                  <Text kabiye weight="bold" className="flex-1 text-[24px] text-white">
                    {word.kbp}
                  </Text>
                  <Text className="ml-4 max-w-[45%] text-right text-[15px] text-white/80">
                    {currentLanguage === 'fr' ? word.fr : word.en}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>

      <View className="px-6 pb-8">
        {/* On a laterite screen the primary action is ink, not laterite on laterite. */}
        <Button variant="primary" fullWidth onPress={onBegin}>
          {t`Begin`}
        </Button>
      </View>
    </View>
  )
}

export default CoverStep
