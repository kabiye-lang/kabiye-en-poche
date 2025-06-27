import React, { useEffect, useRef, useState } from 'react'
import { Animated, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native'
import { Button, Colors, View } from 'react-native-ui-lib'

import { Audio } from 'expo-av'

import { SpeakerHighIcon } from 'phosphor-react-native'

interface ListenTypeProps {
  question: {
    audioUri: string
    correctAnswer: string
  }
  onAnswerSelected: (_answer: string) => void
  showFeedback: boolean
}

const ListenType: React.FC<ListenTypeProps> = ({ question, onAnswerSelected, showFeedback }) => {
  const [typedAnswer, setTypedAnswer] = useState<string>('')
  const [feedbackColor, setFeedbackColor] = useState<string>(Colors.grey40)
  const [, setSound] = useState<Audio.Sound | null>(null)
  const shakeAnimation = useRef(new Animated.Value(0)).current
  const soundRef = useRef<Audio.Sound | null>(null)

  useEffect(() => {
    const playAudio = async () => {
      try {
        if (soundRef.current) {
          await soundRef.current.unloadAsync()
        }
        const { sound } = await Audio.Sound.createAsync({ uri: question.audioUri })
        soundRef.current = sound
        setSound(sound)
        await sound.playAsync()
      } catch (error) {
        console.error('Error playing audio:', error)
      }
    }

    playAudio()

    return () => {
      if (soundRef.current) {
        soundRef.current
          .stopAsync()
          .then(() => soundRef.current?.unloadAsync())
          .catch((error) => {
            console.error('Error unloading sound:', error)
          })
      }
    }
  }, [question.audioUri])

  const validateAnswer = async () => {
    onAnswerSelected(typedAnswer)
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync()
        await soundRef.current.unloadAsync()
        soundRef.current = null
        setSound(null)
      } catch (error) {
        console.error('Error stopping or unloading sound:', error)
      }
    }
    if (typedAnswer === question.correctAnswer) {
      setFeedbackColor(Colors.green30)
    } else {
      setFeedbackColor(Colors.red30)
      Animated.sequence([
        Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start()
    }
  }

  const replayAudio = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.replayAsync()
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync({ uri: question.audioUri })
        soundRef.current = newSound
        setSound(newSound)
        await newSound.playAsync()
      }
    } catch (error) {
      console.error('Error replaying audio:', error)
    }
  }

  return (
    <View padding-20>
      <TouchableOpacity onPress={replayAudio} style={styles.replayButton}>
        <SpeakerHighIcon size={24} color={Colors.white} />
        <Text style={styles.replayText}>Replay Audio</Text>
      </TouchableOpacity>
      <Animated.View style={[styles.inputWrapper, { transform: [{ translateX: shakeAnimation }] }]}>
        <TextInput
          style={[styles.input, { borderColor: feedbackColor }]}
          onChangeText={setTypedAnswer}
          value={typedAnswer}
          placeholder="Type your answer here"
          editable={!showFeedback}
        />
      </Animated.View>
      <Button
        label="Validate"
        onPress={validateAnswer}
        backgroundColor={Colors.primary}
        style={styles.validateButton}
        disabled={showFeedback}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  inputWrapper: {
    marginTop: 10,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
  },
  replayButton: {
    backgroundColor: Colors.green30,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 10,
    flexDirection: 'row',
  },
  replayText: {
    color: Colors.white,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  validateButton: {
    marginTop: 10,
  },
})

export default ListenType
