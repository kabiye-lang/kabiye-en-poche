import { Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { router } from 'expo-router'

import { useLingui } from '@lingui/react/macro'

import { XIcon } from '../icons'
import { Text, View } from '../ui'

interface ProgressBarProps {
  currentStep: number
  totalSteps: number
  onClose?: () => void
}

/**
 * One segment per step, rather than a filling bar.
 *
 * A continuous bar answers "how far along a length am I", which is not the question a
 * learner has mid-lesson. Segments answer "how many more screens" -- countable at a
 * glance, and they make the current step a position rather than an edge. Done is ink,
 * current is laterite, the rest are line.
 *
 * Above about twenty steps the segments are thinner than the gaps between them and stop
 * being countable, so past that it falls back to a single track. That is not a lesson
 * shape we intend -- see MAX_TAUGHT_WORDS in screens/lesson.tsx -- but a learner part-way
 * through one should still see something honest.
 */
const MAX_SEGMENTS = 20

const ProgressBar = ({ currentStep, totalSteps, onClose }: ProgressBarProps) => {
  const insets = useSafeAreaInsets()
  const { t } = useLingui()

  const handleClose = () => {
    if (onClose) onClose()
    else router.back()
  }

  const segmented = totalSteps <= MAX_SEGMENTS

  return (
    <View className="bg-background px-6 pb-3" style={{ paddingTop: insets.top + 10 }}>
      <View className="flex-row items-center gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t`Close lesson`}
          onPress={handleClose}
          className="border-foreground h-9 w-9 items-center justify-center rounded-full border-[1.5px]"
        >
          <XIcon size={16} className="text-foreground" />
        </Pressable>

        <View
          className="flex-1 flex-row items-center gap-[3px]"
          accessibilityRole="progressbar"
          accessibilityLabel={t`Step ${currentStep} of ${totalSteps}`}
          accessibilityValue={{ min: 1, max: totalSteps, now: currentStep }}
        >
          {segmented ? (
            Array.from({ length: totalSteps }, (_, i) => {
              const step = i + 1
              return (
                <View
                  key={step}
                  className={
                    step < currentStep
                      ? 'bg-foreground h-1 flex-1 rounded-sm'
                      : step === currentStep
                        ? 'bg-accent h-1 flex-1 rounded-sm'
                        : 'bg-border h-1 flex-1 rounded-sm'
                  }
                />
              )
            })
          ) : (
            <View className="bg-border h-1 flex-1 overflow-hidden rounded-sm">
              <View
                className="bg-foreground h-full rounded-sm"
                style={{ width: `${Math.min(100, (currentStep / Math.max(totalSteps, 1)) * 100)}%` }}
              />
            </View>
          )}
        </View>

        <Text weight="semibold" className="text-foreground-secondary text-[13px]">
          {currentStep}/{totalSteps}
        </Text>
      </View>
    </View>
  )
}

export default ProgressBar
