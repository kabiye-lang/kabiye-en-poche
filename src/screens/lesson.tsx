import { useState } from 'react'
import { ActivityIndicator, Alert, Modal, ScrollView, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { router, useLocalSearchParams } from 'expo-router'

import { useLingui } from '@lingui/react/macro'

import AudioDialog from '@/components/audio-dialog'
import { ChatCircleDotsIcon, CheckCircleIcon, LightbulbIcon } from '@/components/icons'
import QuizModal from '@/components/quiz'
import { Button, Card, Text, View } from '@/components/ui'
import { useAppCompleteLesson, useAppLesson, useAppLessonContent, useAppQuizQuestions } from '@/hooks/use-app-data'
import { brandColors } from '@/utils/design-system-nativewind'

const LessonScreen = () => {
  const { t } = useLingui()
  const { id } = useLocalSearchParams()
  const lessonId = id as string

  const { data: lesson, isLoading: lessonLoading, error: lessonError } = useAppLesson(lessonId)
  const { data: content, isLoading: contentLoading, error: contentError } = useAppLessonContent(lessonId)
  const { data: quizQuestions, isLoading: quizLoading } = useAppQuizQuestions(lessonId)
  const completeLessonMutation = useAppCompleteLesson()

  const [audioDialogVisible, setAudioDialogVisible] = useState(false)
  const [quizVisible, setQuizVisible] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const insets = useSafeAreaInsets()

  const isLoading = lessonLoading || contentLoading || quizLoading
  const error = lessonError || contentError

  const handleCompleteLesson = async () => {
    try {
      await completeLessonMutation.mutateAsync({ lessonId })
      setIsCompleted(true)
      Alert.alert(t`Lesson Completed!`, t`Great job! You've completed this lesson.`, [
        {
          text: t`Continue`,
          onPress: () => router.back(),
        },
      ])
    } catch {
      Alert.alert(t`Error`, t`Failed to complete lesson. Please try again.`)
    }
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-bg-grey dark:bg-gray-900">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" className="text-primary" />
          <Text className="mt-4">{t`Loading lesson...`}</Text>
        </View>
      </View>
    )
  }

  if (error) {
    return (
      <View className="flex-1 bg-bg-grey dark:bg-gray-900">
        <View className="flex-1 items-center justify-center px-4">
          <Text variant="h6" className="text-center text-primary">
            Failed to load lesson
          </Text>
          <Text variant="caption" className="mt-2 text-center text-text-grey dark:text-gray-400">
            {error.message}
          </Text>
        </View>
      </View>
    )
  }

  const hasQuiz = (content as any)?.has_quiz || (quizQuestions && quizQuestions.length > 0)

  return (
    <View className="bg-grey flex-1 dark:bg-gray-900" safeArea="top">
      <ScrollView className="px-4 pb-5 pt-16">
        {/* Lesson Header */}
        <Text variant="h3" weight="bold" className="text-primary">
          {lesson?.title_en || t`Lesson`}
        </Text>
        <View className="mb-4 mt-2 flex-row items-center justify-stretch">
          {lesson?.difficulty && (
            <View
              className="rounded px-2 py-1"
              style={{
                backgroundColor:
                  lesson.difficulty === 'Beginner'
                    ? '#4CAF5020'
                    : lesson.difficulty === 'Intermediate'
                      ? '#FF980020'
                      : '#F4433620',
              }}
            >
              <Text
                variant="caption"
                style={{
                  color:
                    lesson.difficulty === 'Beginner'
                      ? '#4CAF50'
                      : lesson.difficulty === 'Intermediate'
                        ? '#FF9800'
                        : '#F44336',
                }}
              >
                {lesson.difficulty}
              </Text>
            </View>
          )}
          {isCompleted && (
            <View className="flex-row items-center">
              <CheckCircleIcon size={16} className="text-success" />
              <Text variant="caption" className="ml-1 text-primary">
                {t`Completed`}
              </Text>
            </View>
          )}
        </View>

        {/* Lesson Content */}
        <Card className="mb-4 p-5">
          <Text variant="h5" weight="semibold" className="mb-3 text-primary">
            {t`Content`}
          </Text>
          <Text variant="lg" className="text-text-dark dark:text-gray-100">
            {(content as any)?.content_en || t`Lesson content will be available soon.`}
          </Text>
        </Card>

        {/* Learning Objectives */}
        {lesson?.objectives_en && Array.isArray(lesson.objectives_en) && lesson.objectives_en.length > 0 && (
          <Card className="mb-4 p-5">
            <Text variant="h5" weight="semibold" className="mb-3 text-primary">
              {t`Learning Objectives`}
            </Text>
            {lesson.objectives_en.map((objective, index) => (
              <View key={index} className="mb-2 flex-row items-start">
                <Text variant="lg" className="mr-2 text-primary">
                  •
                </Text>
                <Text variant="lg" className="flex-1 text-text-dark dark:text-gray-100">
                  {objective}
                </Text>
              </View>
            ))}
          </Card>
        )}

        {/* Examples */}
        {(content as any)?.examples_en &&
          Array.isArray((content as any).examples_en) &&
          (content as any).examples_en.length > 0 && (
            <Card className="mb-4 p-5">
              <Text variant="h5" weight="semibold" className="mb-3 text-primary">
                {t`Examples`}
              </Text>
              {(content as any).examples_en.map((example: any, index: number) => (
                <View key={index} className="bg-grey mb-3 rounded-lg p-3">
                  <Text variant="lg" className="text-text-dark dark:text-gray-100">
                    {typeof example === 'string' ? example : JSON.stringify(example)}
                  </Text>
                </View>
              ))}
            </Card>
          )}

        {/* Complete Lesson Button */}
        {!isCompleted && (
          <Button onPress={handleCompleteLesson} loading={completeLessonMutation.isPending} className="w-full">
            <View className="flex-row items-center justify-center">
              <CheckCircleIcon size={20} className="text-white" />
              <Text variant="body" className="ml-2 text-white">
                {t`Complete Lesson`}
              </Text>
            </View>
          </Button>
        )}
      </ScrollView>

      {/* Bottom Action Bar */}
      <View className="border-grey border-t bg-white px-6 py-4" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        <View className="flex-row items-center justify-center space-x-8">
          {/* Audio Action */}
          <TouchableOpacity onPress={() => setAudioDialogVisible(true)} className="items-center">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-primary">
              <ChatCircleDotsIcon size={20} className="text-white" />
            </View>
            <Text variant="caption" className="mt-1 text-center text-primary">
              {t`Audio`}
            </Text>
          </TouchableOpacity>

          {/* Quiz Action */}
          {hasQuiz && (
            <TouchableOpacity onPress={() => setQuizVisible(true)} className="items-center">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-secondary">
                <LightbulbIcon size={20} className="text-white" />
              </View>
              <Text variant="caption" className="mt-1 text-center text-secondary">
                {t`Quiz`}
              </Text>
            </TouchableOpacity>
          )}

          {/* Completion Status */}
          {isCompleted && (
            <View className="items-center">
              <View className="bg-success h-12 w-12 items-center justify-center rounded-full">
                <CheckCircleIcon size={20} className="text-white" />
              </View>
              <Text variant="caption" className="mt-1 text-center text-primary">
                {t`Completed`}
              </Text>
            </View>
          )}
        </View>
      </View>
      <Modal visible={audioDialogVisible} transparent animationType="slide">
        <AudioDialog onClose={() => setAudioDialogVisible(false)} />
      </Modal>
      <Modal visible={quizVisible} transparent animationType="slide">
        <QuizModal onClose={() => setQuizVisible(false)} />
      </Modal>
    </View>
  )
}

export default LessonScreen
