import { useEffect, useState } from 'react'
import { Pressable } from 'react-native'
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { router } from 'expo-router'

import { XIcon } from '../icons'
import { Text, View } from '../ui'

interface ProgressBarProps {
  currentStep: number
  totalSteps: number
  onClose?: () => void
}

const ProgressBar = ({ currentStep, totalSteps, onClose }: ProgressBarProps) => {
  const insets = useSafeAreaInsets()
  const progress = (currentStep / totalSteps) * 100

  const [trackWidth, setTrackWidth] = useState(0)
  const fillWidth = useSharedValue(0)

  useEffect(() => {
    if (trackWidth > 0) {
      fillWidth.value = withTiming((progress / 100) * trackWidth, {
        duration: 400,
        easing: Easing.out(Easing.quad),
        reduceMotion: ReduceMotion.System,
      })
    }
  }, [progress, trackWidth])

  const fillStyle = useAnimatedStyle(() => ({ width: fillWidth.value }))

  const handleClose = () => {
    if (onClose) {
      onClose()
    } else {
      router.back()
    }
  }

  return (
    <View className="border-border bg-card border-b px-4 pb-3" style={{ paddingTop: insets.top + 12 }}>
      <View className="flex-row items-center">
        {/* Close Button */}
        <Pressable onPress={handleClose} className="mr-3 rounded-full p-1">
          <XIcon size={24} className="text-foreground" />
        </Pressable>

        {/* Progress Bar */}
        <View className="flex-1">
          <View
            className="bg-progress-track h-3 overflow-hidden rounded-full"
            onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
          >
            <Animated.View className="bg-primary h-full rounded-full" style={fillStyle} />
          </View>
        </View>

        {/* Step Counter */}
        <Text variant="caption" className="text-foreground-secondary ml-3">
          {currentStep}/{totalSteps}
        </Text>
      </View>
    </View>
  )
}

export default ProgressBar
