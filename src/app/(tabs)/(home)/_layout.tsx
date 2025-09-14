import { Stack } from 'expo-router'

import { useLingui } from '@lingui/react/macro'

export default function TabHomeLayout() {
  const { t } = useLingui()

  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="alphabet"
        options={{
          title: '',
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="units"
        options={{
          title: t`Learning Units`,
          headerTransparent: false,
        }}
      />
    </Stack>
  )
}
