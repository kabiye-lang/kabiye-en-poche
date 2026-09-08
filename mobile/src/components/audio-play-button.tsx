import type { PressableProps } from 'react-native'

import { ActivityIndicator, Pressable } from 'react-native'
import Animated from 'react-native-reanimated'

import { useLingui } from '@lingui/react/macro'

import { useAccentColor, usePrimaryColor, usePrimaryForegroundColor } from '../hooks/use-theme-color'
import { SpeakerHighIcon, SpeakerSlashIcon } from './icons'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

type AudioPlayButtonProps = {
  isPlaying: boolean
  isLoading: boolean
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  onPress: () => void
} & Omit<PressableProps, 'onPress'>

const sizeConfig = {
  sm: { button: 40, icon: 20 },
  md: { button: 64, icon: 32 },
  lg: { button: 96, icon: 48 },
} as const

export const AudioPlayButton = ({
  isPlaying,
  isLoading,
  disabled,
  size = 'lg',
  onPress,
  ...rest
}: AudioPlayButtonProps) => {
  const { button, icon } = sizeConfig[size]
  const { t } = useLingui()
  const primary = usePrimaryColor()

  // All three backgrounds are set here. The idle colour used to come from a
  // `bg-primary` class instead, but this inline `backgroundColor` -- `undefined`
  // in the idle case -- won the merge, so the white icon sat on a transparent
  // circle and the button was invisible on the white activity card.
  //
  // Playing used to be #22c55e and disabled #d1d5db. This palette has no green and no
  // grey, and both were hardcoded so neither followed the theme. Playing takes the one
  // accent -- it is a state the reader caused -- and disabled is the same fill at the
  // 40% the system already uses for a button that is not yet available.
  const accent = useAccentColor()
  const onPrimary = usePrimaryForegroundColor()
  const background = isPlaying ? accent : primary

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled || isLoading}
      accessibilityRole="button"
      accessibilityLabel={isPlaying ? t`Stop audio` : t`Play audio`}
      accessibilityState={{ disabled: disabled || isLoading, busy: isLoading }}
      style={{
        width: button,
        height: button,
        borderRadius: button / 2,
        alignItems: 'center',
        justifyContent: 'center',
        transitionProperty: 'transform',
        transitionDuration: 150,
        backgroundColor: background,
        opacity: disabled ? 0.4 : 1,
        borderCurve: 'continuous',
      }}
      {...rest}
    >
      {({ pressed }) => (
        <Animated.View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ scale: pressed ? 0.9 : isPlaying ? 1.05 : 1 }],
            transitionProperty: 'transform',
            transitionDuration: 150,
          }}
        >
          {isLoading ? (
            /* White, not paper: in dark the primary fill *is* paper, so a white glyph on
               it was a white circle. */
            <ActivityIndicator size={size === 'sm' ? 'small' : 'large'} color={onPrimary} />
          ) : isPlaying ? (
            <SpeakerHighIcon size={icon} color={onPrimary} weight="fill" />
          ) : (
            <SpeakerSlashIcon size={icon} color={onPrimary} weight="fill" />
          )}
        </Animated.View>
      )}
    </AnimatedPressable>
  )
}
