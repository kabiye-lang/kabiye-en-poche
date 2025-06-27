import React, { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native'
import { Button, Card, Colors, Text, View } from 'react-native-ui-lib'

import { useLocalSearchParams } from 'expo-router'

import { XIcon } from 'phosphor-react-native'

import { quizContents } from '@/utils/units'

import ListenChose from './listen-chose'
import ListenType from './listen-type'
import MatchPairs from './match-pairs'
import OrderWords from './order-words'

interface QuizModalProps {
  onClose: () => void
}

interface Question {
  type: string
  question: string
  correctAnswer: string
  words?: string[]
  answers?: string[]
  options?: string[]
  pairs?: [string, string][]
  prompt?: string
  audioUri?: string
}

const QuizModal: React.FC<QuizModalProps> = ({ onClose }) => {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [showFeedback, setShowFeedback] = useState(false)
  // @ts-expect-error id undefined
  const quiz = quizContents[id]

  useEffect(() => {
    setSelectedAnswer(null)
    setShowFeedback(false)
  }, [currentQuestionIndex])

  if (!id) {
    return
  }
  const currentQuestion: Question = quiz.questions[currentQuestionIndex]

  const handleAnswerPress = (answer: string) => {
    setSelectedAnswer(answer)
    setShowFeedback(true)
    if (answer === currentQuestion.correctAnswer) {
      setScore(score + 1)
    }
  }

  const handleNextPress = () => {
    setShowFeedback(false)
    setSelectedAnswer(null)
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      setShowFeedback(true)
    }
  }

  const renderQuestion = () => {
    switch (currentQuestion.type) {
      case 'multiple-choice':
        return currentQuestion.answers!.map((answer, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.answerButton, selectedAnswer === answer && styles.selectedAnswerButton]}
            onPress={() => handleAnswerPress(answer)}
            disabled={showFeedback}
          >
            <Text text70 style={styles.answerText}>
              {answer}
            </Text>
          </TouchableOpacity>
        ))
      case 'true-false':
        return ['True', 'False'].map((answer, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.answerButton, selectedAnswer === answer && styles.selectedAnswerButton]}
            onPress={() => handleAnswerPress(answer)}
            disabled={showFeedback}
          >
            <Text text70 style={styles.answerText}>
              {answer}
            </Text>
          </TouchableOpacity>
        ))
      case 'fill-in-the-blank':
        return (
          <View>
            <Text style={styles.answerText}>{currentQuestion.prompt}</Text>
            {currentQuestion.answers!.map((answer, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.answerButton, selectedAnswer === answer && styles.selectedAnswerButton]}
                onPress={() => handleAnswerPress(answer)}
                disabled={showFeedback}
              >
                <Text text70 style={styles.answerText}>
                  {answer}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )
      case 'match-pairs':
        return (
          // @ts-expect-error question type
          <MatchPairs question={currentQuestion} onAnswerSelected={handleAnswerPress} showFeedback={showFeedback} />
        )
      case 'order-words':
        return (
          // @ts-expect-error question type
          <OrderWords question={currentQuestion} onAnswerSelected={handleAnswerPress} showFeedback={showFeedback} />
        )
      case 'listen-type':
        return (
          // @ts-expect-error question type
          <ListenType question={currentQuestion} onAnswerSelected={handleAnswerPress} showFeedback={showFeedback} />
        )
      case 'listen-chose':
        return (
          // @ts-expect-error question type
          <ListenChose question={currentQuestion} onAnswerSelected={handleAnswerPress} showFeedback={showFeedback} />
        )
      default:
        return null
    }
  }

  return (
    <View style={styles.container} useSafeArea>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <XIcon size={24} color="black" />
        </TouchableOpacity>
        <Text text60 marginL-20 style={styles.title}>
          Quiz
        </Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingVertical: 20, paddingHorizontal: 10 }}>
        <View flex paddingH-10 paddingT-20>
          <Card marginB-20 padding-20 style={styles.card}>
            <Text text50 marginB-10 style={styles.title}>
              {currentQuestion.question}
            </Text>
            {renderQuestion()}
          </Card>
          {showFeedback && (
            <View style={styles.feedbackContainer}>
              <Text text60 style={styles.feedbackText}>
                {selectedAnswer === currentQuestion.correctAnswer
                  ? 'Correct!'
                  : `Incorrect! The correct answer is ${currentQuestion.correctAnswer}.`}
              </Text>
              {currentQuestionIndex < quiz.questions.length - 1 ? (
                <Button label="Next" onPress={handleNextPress} style={styles.nextButton} />
              ) : (
                <Text text60 style={styles.finalScoreText}>
                  Quiz finished! Your score is {score} out of {quiz.questions.length}.
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginTop: 'auto',
    marginBottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grey60,
  },
  closeText: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
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
    color: Colors.textDark,
  },
  answerButton: {
    backgroundColor: Colors.grey70,
    borderRadius: 12,
    padding: 15,
    marginTop: 10,
  },
  selectedAnswerButton: {
    backgroundColor: Colors.secondary,
  },
  answerText: {
    color: Colors.textDark,
  },
  feedbackContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  feedbackText: {
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 20,
  },
  nextButton: {
    backgroundColor: Colors.primary,
  },
  finalScoreText: {
    fontWeight: 'bold',
    color: Colors.secondary,
  },
})

export default QuizModal
