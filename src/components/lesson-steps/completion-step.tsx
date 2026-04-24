import { TouchableOpacity } from 'react-native'

import { router } from 'expo-router'

import { useLingui } from '@lingui/react/macro'

import { CheckCircleIcon, HouseIcon } from '@/components/icons'
import { Button, Card, Text, View } from '@/components/ui'

interface CompletionStepProps {
  score?: number
  totalQuestions?: number
  onComplete: () => void
}

const CompletionStep = ({ score = 0, totalQuestions = 0, onComplete }: CompletionStepProps) => {
  const { t } = useLingui()

  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 100
  const isPerfect = percentage === 100
  const isGood = percentage >= 80
  const isPass = percentage >= 60

  const getMessage = () => {
    if (isPerfect) return t`Perfect! You're a star! 🌟`
    if (isGood) return t`Great job!`
    if (isPass) return t`Well done! Keep practicing! 💪`
    return t`Keep trying! Practice makes perfect! 📚`
  }

  const getColor = () => {
    if (isPerfect) return 'text-yellow-500'
    if (isGood) return 'text-green-500'
    if (isPass) return 'text-blue-500'
    return 'text-orange-500'
  }

  return (
    <View className="flex-1 items-center justify-center px-6">
      {/* Success Icon */}
      <View className="mb-6 items-center">
        <View className="bg-success-bg h-32 w-32 items-center justify-center rounded-full">
          <CheckCircleIcon size={80} weight="fill" className="text-green-500" />
        </View>
      </View>

      {/* Title */}
      <Text variant="h1" weight="bold" className="text-primary mb-2 text-center">
        {t`Lesson Complete!`}
      </Text>

      {/* Message */}
      <Text variant="h4" weight="semibold" className={`mb-8 text-center ${getColor()}`}>
        {getMessage()}
      </Text>

      {/* Score Card */}
      {totalQuestions > 0 && (
        <Card className="mb-8 w-full p-6">
          <View className="items-center">
            <Text variant="caption" className="text-foreground-secondary mb-2">
              {t`Your Score`}
            </Text>
            <Text variant="h1" weight="bold" className={getColor()}>
              {percentage}%
            </Text>
            <Text variant="caption" className="text-foreground-secondary mt-2">
              {score} {t`out of`} {totalQuestions} {t`correct`}
            </Text>
          </View>
        </Card>
      )}

      {/* Action Buttons */}
      <View className="w-full gap-3">
        <Button variant="primary" onPress={onComplete} className="w-full">
          <Text variant="body" weight="bold" className="text-white">
            {t`Back to Lessons`}
          </Text>
        </Button>

        <TouchableOpacity onPress={() => router.push('/learn')} className="w-full">
          <View className="flex-row items-center justify-center py-3">
            <HouseIcon size={20} className="text-primary" />
            <Text variant="body" className="text-primary ml-2">
              {t`Back to Learn`}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default CompletionStep
