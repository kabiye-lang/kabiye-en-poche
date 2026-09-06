import { Stack } from 'expo-router'

import { msg } from '@lingui/core/macro'

import i18n from '../../../i18n'

export default function TabHomeLayout() {
  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
      {/* The alphabet screen's back button borrows this screen's title. Without one it
          announced the route name, "index", to VoiceOver. */}
      <Stack.Screen name="index" options={{ headerShown: false, title: i18n._(msg`Back`) }} />
      <Stack.Screen
        name="alphabet"
        options={{
          title: '',
          headerTransparent: true,
        }}
      />
    </Stack>
  )
}
