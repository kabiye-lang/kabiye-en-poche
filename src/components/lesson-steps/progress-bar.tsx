import { TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { router } from 'expo-router'

import { XIcon } from '@/components/icons'
import { Text, View } from '@/components/ui'

interface ProgressBarProps {
  currentStep: number
  totalSteps: number
  onClose?: () => void
}

const ProgressBar = ({ currentStep, totalSteps, onClose }: ProgressBarProps) => {
  const insets = useSafeAreaInsets()
  const progress = (currentStep / totalSteps) * 100

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
        <TouchableOpacity onPress={handleClose} className="mr-3 rounded-full p-1">
          <XIcon size={24} className="text-foreground" />
        </TouchableOpacity>

        {/* Progress Bar */}
        <View className="flex-1">
          <View className="bg-progress-track h-3 overflow-hidden rounded-full">
            <View
              className="bg-primary h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
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
