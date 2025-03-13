import { useTranslation } from 'react-i18next'

import { Stack } from 'expo-router'

export default function TabHomeLayout() {
  const { t } = useTranslation()

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
          title: t('units.screen.title'),
          headerTransparent: false,
        }}
      />
    </Stack>
  )
}
