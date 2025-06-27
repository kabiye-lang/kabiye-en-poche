import React, { useState } from 'react'
import { Modal, ScrollView, StyleSheet, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Card, Colors, Text, View } from 'react-native-ui-lib'

import { useLocalSearchParams } from 'expo-router'

import AudioDialog from '@/components/audio-dialog'
import { ChatCircleDotsIcon, LightbulbIcon } from '@/components/icons'
import QuizModal from '@/components/quiz'
import { lessonContents } from '@/utils/units'

const LessonScreen = () => {
  const { id } = useLocalSearchParams()
  // @ts-expect-error id undefined
  const lesson = lessonContents[id]
  const [audioDialogVisible, setAudioDialogVisible] = useState(false)
  const [quizVisible, setQuizVisible] = useState(false)
  const insets = useSafeAreaInsets()

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgGrey }}>
      <ScrollView contentContainerStyle={{ paddingVertical: 20, paddingHorizontal: 10 }}>
        <View flex paddingH-10 paddingT-20>
          <Card marginB-20 padding-20 style={styles.card}>
            <Text text50 marginB-10 style={styles.title}>
              {lesson.title}
            </Text>
            <Text text70 marginB-20 style={styles.content}>
              {lesson.content}
            </Text>
            {lesson.examples && lesson.examples.length > 0 && (
              <View marginT-20>
                <Text text70 marginB-10 style={styles.examplesTitle}>
                  Examples
                </Text>
                {/* @ts-expect-error any */}
                {lesson.examples.map((example, index) => (
                  <Text key={index} text70 marginB-10 style={styles.exampleText}>
                    {example}
                  </Text>
                ))}
              </View>
            )}
          </Card>
        </View>
      </ScrollView>
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity onPress={() => setAudioDialogVisible(true)}>
          <ChatCircleDotsIcon size={24} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setQuizVisible(true)}>
          <LightbulbIcon size={24} color={Colors.primary} />
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  title: {
    fontWeight: 'bold',
    color: Colors.primary,
  },
  content: {
    color: Colors.textDark,
  },
  examplesTitle: {
    fontWeight: 'bold',
    color: Colors.secondary,
  },
  exampleText: {
    color: Colors.textDark,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 15,
    backgroundColor: Colors.white,
  },
})

export default LessonScreen
