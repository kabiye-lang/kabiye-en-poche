import React, { useState } from 'react'
import { Modal, ScrollView, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useLocalSearchParams } from 'expo-router'

import AudioDialog from '@/components/audio-dialog'
import { ChatCircleDotsIcon, LightbulbIcon } from '@/components/icons'
import QuizModal from '@/components/quiz'
import { Card, Text, View } from '@/components/ui'
import { lessonContents } from '@/utils/units'

const LessonScreen = () => {
  const { id } = useLocalSearchParams()
  // @ts-expect-error id undefined
  const lesson = lessonContents[id]
  const [audioDialogVisible, setAudioDialogVisible] = useState(false)
  const [quizVisible, setQuizVisible] = useState(false)
  const insets = useSafeAreaInsets()

  return (
    <View className="flex-1 bg-bg-grey">
      <ScrollView contentContainerStyle={{ paddingVertical: 20, paddingHorizontal: 10 }}>
        <View flex className="px-2.5 pt-5">
          <Card variant="elevated" className="mb-5 p-5">
            <Text variant="h3" weight="bold" color="primary" className="mb-2.5">
              {lesson.title}
            </Text>
            <Text variant="lg" color="dark" className="mb-5">
              {lesson.content}
            </Text>
            {lesson.examples && lesson.examples.length > 0 && (
              <View className="mt-5">
                <Text variant="lg" weight="bold" color="secondary" className="mb-2.5">
                  Examples
                </Text>
                {/* @ts-expect-error any */}
                {lesson.examples.map((example, index) => (
                  <Text key={index} variant="lg" color="dark" className="mb-2.5">
                    {example}
                  </Text>
                ))}
              </View>
            )}
          </Card>
        </View>
      </ScrollView>
      <View className="flex-row items-center justify-around bg-white py-4" style={{ paddingBottom: insets.bottom }}>
        <TouchableOpacity onPress={() => setAudioDialogVisible(true)}>
          <ChatCircleDotsIcon size={24} color="#6200EE" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setQuizVisible(true)}>
          <LightbulbIcon size={24} color="#6200EE" />
        </TouchableOpacity>
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
