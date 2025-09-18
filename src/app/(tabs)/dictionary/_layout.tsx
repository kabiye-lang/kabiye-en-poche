import { Stack } from 'expo-router'

export default function TabDictionaryLayout() {
  // const { t } = useTranslation()

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="search"
        options={{
          title: '',
          headerTransparent: true,
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
    </Stack>
  )
}
