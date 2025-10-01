import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Modal, ScrollView, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { router, useLocalSearchParams, useNavigation } from 'expo-router'

import { useLingui } from '@lingui/react/macro'
import { ListBulletsIcon, XIcon } from 'phosphor-react-native'

import AudioDialog from '@/components/audio-dialog'
import { ChatCircleDotsIcon, CheckCircleIcon, LightbulbIcon } from '@/components/icons'
import QuizModal from '@/components/quiz'
import { Button, Card, Text, View } from '@/components/ui'
import { useAppCompleteLesson, useAppLesson, useAppLessonContent, useAppQuizQuestions } from '@/hooks/use-app-data'

const LessonScreen = () => {
  const { t } = useLingui()
  const { id } = useLocalSearchParams()
  const navigation = useNavigation()
  const lessonId = id as string

  const { data: lesson, isLoading: lessonLoading, error: lessonError } = useAppLesson(lessonId)
  const { data: content, isLoading: contentLoading, error: contentError } = useAppLessonContent(lessonId)
  const { data: quizQuestions, isLoading: quizLoading } = useAppQuizQuestions(lessonId)
  const completeLessonMutation = useAppCompleteLesson()

  const [audioDialogVisible, setAudioDialogVisible] = useState(false)
  const [quizVisible, setQuizVisible] = useState(false)
  const [objectivesVisible, setObjectivesVisible] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const insets = useSafeAreaInsets()

  // Set navigation options with objectives button
  useEffect(() => {
    if (lesson?.objectives_en && lesson.objectives_en.length > 0) {
      navigation.setOptions({
        headerRight: () => (
          <Button
            variant="ghost"
            onPress={() => setObjectivesVisible(true)}
            className="!h-10 !w-10 flex-col items-center justify-center rounded-full !px-0 !py-0"
          >
            <ListBulletsIcon size={32} className="text-text-dark dark:text-text-light" />
          </Button>
        ),
      })
    }
  }, [navigation, lesson])

  const isLoading = lessonLoading || contentLoading || quizLoading
  const error = lessonError || contentError

  const handleCompleteLesson = async () => {
    try {
      await completeLessonMutation.mutateAsync(lessonId)
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
            {t`Failed to load lesson`}
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

        {/* Examples */}
        {(content as any)?.examples_en &&
          Array.isArray((content as any).examples_en) &&
          (content as any).examples_en.length > 0 && (
            <Card className="mb-4 p-5">
              <Text variant="h5" weight="semibold" className="mb-3 text-primary">
                {t`Examples`}
              </Text>
              {(content as any).examples_en.map((example: any, index: number) => (
                <View
                  key={index}
                  className="mb-3 flex-row items-center justify-between rounded-lg bg-bg-grey p-3 dark:bg-gray-700"
                >
                  <Text variant="h6" weight="bold" className="text-primary">
                    {example.kabiye || example}
                  </Text>
                  {example.english && (
                    <Text variant="body" className="text-text-grey dark:text-gray-400">
                      {example.english}
                    </Text>
                  )}
                </View>
              ))}
            </Card>
          )}

        {/* Complete Lesson Button */}
        {!isCompleted && (
          <Button onPress={handleCompleteLesson} loading={completeLessonMutation.isPending} className="mb-8 w-full">
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
      <View className="border-t-hairline bg-white px-6 py-4" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        <View className="flex-row items-center justify-center gap-x-4 space-x-8">
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
      {/* Modals */}
      <Modal visible={audioDialogVisible} transparent animationType="slide">
        <AudioDialog onClose={() => setAudioDialogVisible(false)} />
      </Modal>

      <Modal visible={quizVisible} transparent animationType="slide">
        <QuizModal onClose={() => setQuizVisible(false)} />
      </Modal>

      {/* Learning Objectives Modal */}
      <Modal visible={objectivesVisible} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/50 px-4">
          <View className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-800">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
              <Text variant="h4" weight="bold" className="text-primary">
                {t`Learning Objectives`}
              </Text>
              <TouchableOpacity
                onPress={() => setObjectivesVisible(false)}
                className="rounded-full bg-gray-100 p-2 dark:bg-gray-700"
              >
                <XIcon size={20} className="text-text-dark dark:text-gray-100" />
              </TouchableOpacity>
            </View>

            {/* Modal Content */}
            <ScrollView className="max-h-96 p-4" showsVerticalScrollIndicator={false}>
              {lesson?.objectives_en && Array.isArray(lesson.objectives_en) && lesson.objectives_en.length > 0 ? (
                lesson.objectives_en.map((objective, index) => (
                  <View key={index} className="mb-3 flex-row items-start">
                    <View className="mr-3 mt-1 h-6 w-6 items-center justify-center rounded-full bg-primary">
                      <Text variant="caption" weight="bold" className="text-white">
                        {index + 1}
                      </Text>
                    </View>
                    <Text variant="lg" className="flex-1 text-text-dark dark:text-gray-100">
                      {objective}
                    </Text>
                  </View>
                ))
              ) : (
                <Text variant="body" className="text-center text-text-grey dark:text-gray-400">
                  {t`No learning objectives available for this lesson.`}
                </Text>
              )}
            </ScrollView>

            {/* Modal Footer */}
            <View className="border-t border-gray-200 p-4 dark:border-gray-700">
              <Button variant="primary" onPress={() => setObjectivesVisible(false)} className="w-full">
                {t`Got it!`}
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

export default LessonScreen
