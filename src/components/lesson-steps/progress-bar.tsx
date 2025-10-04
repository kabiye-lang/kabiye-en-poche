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
    <View
      className="border-b border-gray-200 bg-white px-4 pb-3 dark:border-gray-700 dark:bg-gray-800"
      style={{ paddingTop: insets.top + 12 }}
    >
      <View className="flex-row items-center">
        {/* Close Button */}
        <TouchableOpacity onPress={handleClose} className="mr-3 rounded-full p-1">
          <XIcon size={24} className="text-text-dark dark:text-gray-100" />
        </TouchableOpacity>

        {/* Progress Bar */}
        <View className="flex-1">
          <View className="h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <View
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </View>
        </View>

        {/* Step Counter */}
        <Text variant="caption" className="ml-3 text-text-grey dark:text-gray-400">
          {currentStep}/{totalSteps}
        </Text>
      </View>
    </View>
  )
}

export default ProgressBar
