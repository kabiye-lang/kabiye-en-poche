import { Stack } from 'expo-router'

import LessonScreen from '../../screens/lesson'

export default function LessonPage() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <LessonScreen />
    </>
  )
}
