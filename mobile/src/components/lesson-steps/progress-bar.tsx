import { Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

import { useLingui } from '@lingui/react/macro'

import { XIcon } from '../icons'
import { Text, View } from '../ui'

/**
 * The ground the step behind the bar is standing on.
 *
 * Three lesson steps are full-bleed -- the cover and the finish are laterite, Spot the
 * letter is ink -- and the bar stayed bone paper over all of them, a bright band across
 * the top of a near-black screen. The frame belongs to the step, so it takes the step's
 * ground and re-picks its own colours against it.
 */
export type ProgressTone = 'paper' | 'accent' | 'ink'

const TONES: Record<
  ProgressTone,
  { ground: string; control: string; glyph: string; done: string; current: string; rest: string; counter: string }
> = {
  paper: {
    ground: 'bg-background',
    control: 'border-foreground',
    glyph: 'text-foreground',
    done: 'bg-foreground',
    current: 'bg-accent',
    rest: 'bg-border',
    counter: 'text-foreground-secondary',
  },
  accent: {
    ground: 'bg-accent',
    control: 'border-white',
    glyph: 'text-white',
    // Done is ink, the colour laterite screens already give their primary action;
    // current is the brightest thing on the row, so the eye lands on it.
    done: 'bg-surface-ink',
    current: 'bg-white',
    rest: 'bg-white/30',
    counter: 'text-white/80',
  },
  ink: {
    ground: 'bg-surface-ink',
    control: 'border-on-surface-ink',
    glyph: 'text-on-surface-ink',
    done: 'bg-on-surface-ink',
    current: 'bg-accent-on-ink',
    rest: 'bg-on-surface-ink/25',
    counter: 'text-on-surface-ink/70',
  },
}

interface ProgressBarProps {
  currentStep: number
  totalSteps: number
  onClose?: () => void
  tone?: ProgressTone
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

const ProgressBar = ({ currentStep, totalSteps, onClose, tone = 'paper' }: ProgressBarProps) => {
  const insets = useSafeAreaInsets()
  const { t } = useLingui()
  const palette = TONES[tone]

  const handleClose = () => {
    if (onClose) onClose()
    else router.back()
  }

  const segmented = totalSteps <= MAX_SEGMENTS

  return (
    <View className={`${palette.ground} px-6 pb-3`} style={{ paddingTop: insets.top + 10 }}>
      {/* The clock and the battery sit on this ground too. On the laterite cover and the
          ink Spot-the-letter screen the app's theme-wide dark status bar was a row of
          near-invisible glyphs; both grounds are dark, so both want the light one. */}
      <StatusBar style={tone === 'paper' ? 'auto' : 'light'} />
      <View className="flex-row items-center gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t`Close lesson`}
          onPress={handleClose}
          className={`${palette.control} h-9 w-9 items-center justify-center rounded-full border-[1.5px]`}
        >
          <XIcon size={16} className={palette.glyph} />
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
                  className={`h-1 flex-1 rounded-sm ${
                    step < currentStep ? palette.done : step === currentStep ? palette.current : palette.rest
                  }`}
                />
              )
            })
          ) : (
            <View className={`h-1 flex-1 overflow-hidden rounded-sm ${palette.rest}`}>
              <View
                className={`h-full rounded-sm ${palette.done}`}
                style={{ width: `${Math.min(100, (currentStep / Math.max(totalSteps, 1)) * 100)}%` }}
              />
            </View>
          )}
        </View>

        <Text weight="semibold" className={`${palette.counter} text-[13px]`}>
          {currentStep}/{totalSteps}
        </Text>
      </View>
    </View>
  )
}

export default ProgressBar
