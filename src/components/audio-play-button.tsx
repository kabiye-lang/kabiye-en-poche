import type { PressableProps } from 'react-native'

import { ActivityIndicator, Pressable } from 'react-native'
import Animated from 'react-native-reanimated'

import { SpeakerHighIcon, SpeakerSlashIcon } from '@/components/icons'

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

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled || isLoading}
      style={{
        width: button,
        height: button,
        borderRadius: button / 2,
        alignItems: 'center',
        justifyContent: 'center',
        transitionProperty: 'transform',
        transitionDuration: 150,
        backgroundColor: disabled ? '#d1d5db' : isPlaying ? '#22c55e' : undefined,
        borderCurve: 'continuous',
      }}
      className={disabled ? '' : isPlaying ? '' : 'bg-primary'}
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
            <ActivityIndicator size={size === 'sm' ? 'small' : 'large'} color="white" />
          ) : isPlaying ? (
            <SpeakerHighIcon size={icon} color="white" weight="fill" />
          ) : (
            <SpeakerSlashIcon size={icon} color="white" weight="fill" />
          )}
        </Animated.View>
      )}
    </AnimatedPressable>
  )
}
