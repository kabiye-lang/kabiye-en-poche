import { TouchableOpacity } from 'react-native'
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated'

import { router } from 'expo-router'

import { useLingui } from '@lingui/react/macro'

import { CheckCircleIcon, HouseIcon } from '@/components/icons'
import { Button, Card, Text, View } from '@/components/ui'

interface CompletionStepProps {
  score?: number
  totalQuestions?: number
  contentSteps?: number
  onComplete: () => void
}

const CompletionStep = ({ score = 0, totalQuestions = 0, contentSteps = 0, onComplete }: CompletionStepProps) => {
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
    if (isPerfect) return 'text-hint'
    if (isGood) return 'text-success-text'
    if (isPass) return 'text-primary'
    return 'text-accent'
  }

  return (
    <View className="flex-1 items-center justify-center px-6">
      {/* Success Icon */}
      <Animated.View entering={ZoomIn.duration(320)} className="mb-6 items-center">
        <View className="bg-success-bg h-32 w-32 items-center justify-center rounded-full">
          <CheckCircleIcon size={80} weight="fill" className="text-success-text" />
        </View>
      </Animated.View>

      {/* Title + Message */}
      <Animated.View entering={FadeInUp.duration(280).delay(200)} className="items-center">
        <Text variant="h1" weight="bold" className="text-primary mb-2 text-center">
          {t`Lesson Complete!`}
        </Text>
        <Text variant="h4" weight="semibold" className={`mb-8 text-center ${getColor()}`}>
          {getMessage()}
        </Text>
      </Animated.View>

      {/* Score Card */}
      <Animated.View entering={FadeInUp.duration(280).delay(360)} className="w-full">
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
              {contentSteps > 0 && (
                <Text variant="caption" className="text-foreground-secondary mt-1">
                  {contentSteps} {contentSteps === 1 ? t`reading slide` : t`reading slides`}
                </Text>
              )}
            </View>
          </Card>
        )}
      </Animated.View>

      {/* Action Buttons */}
      <Animated.View entering={FadeInUp.duration(280).delay(480)} className="w-full gap-3">
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
      </Animated.View>
    </View>
  )
}

export default CompletionStep
