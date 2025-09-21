import { useEffect, useState } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import '../global.css'
import 'intl-pluralrules'

import { loadAsync } from 'expo-font'
import { SplashScreen, Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

import {
  Figtree_300Light,
  Figtree_300Light_Italic,
  Figtree_400Regular,
  Figtree_400Regular_Italic,
  Figtree_500Medium,
  Figtree_500Medium_Italic,
  Figtree_600SemiBold,
  Figtree_600SemiBold_Italic,
  Figtree_700Bold,
  Figtree_700Bold_Italic,
  Figtree_800ExtraBold,
  Figtree_800ExtraBold_Italic,
  Figtree_900Black,
  Figtree_900Black_Italic,
} from '@expo-google-fonts/figtree'
import {
  IBMPlexSansHebrew_100Thin,
  IBMPlexSansHebrew_200ExtraLight,
  IBMPlexSansHebrew_300Light,
  IBMPlexSansHebrew_400Regular,
  IBMPlexSansHebrew_500Medium,
  IBMPlexSansHebrew_600SemiBold,
  IBMPlexSansHebrew_700Bold,
} from '@expo-google-fonts/ibm-plex-sans-hebrew'
import { ThemeProvider } from '@react-navigation/native'
import { QueryClientProvider } from '@tanstack/react-query'
import { useColorScheme } from 'nativewind'

import i18n, { I18nProvider } from '@/i18n'
import { queryClient } from '@/lib/query-client'
import { getNavigationTheme, getStatusBarStyle } from '@/utils/design-system-nativewind'

// react-native-ui-lib config removed - using NativeWind instead

export default function RootLayout() {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(false)
  const { colorScheme } = useColorScheme()
  console.log(colorScheme)

  const onLaunch = async () => {
    let fontsError = false
    try {
      await Promise.all([
        loadAsync({
          IBMPlexSansHebrew_100Thin,
          IBMPlexSansHebrew_200ExtraLight,
          IBMPlexSansHebrew_300Light,
          IBMPlexSansHebrew_400Regular,
          IBMPlexSansHebrew_500Medium,
          IBMPlexSansHebrew_600SemiBold,
          IBMPlexSansHebrew_700Bold,
          Figtree_300Light,
          Figtree_400Regular,
          Figtree_500Medium,
          Figtree_600SemiBold,
          Figtree_700Bold,
          Figtree_800ExtraBold,
          Figtree_900Black,
          Figtree_300Light_Italic,
          Figtree_400Regular_Italic,
          Figtree_500Medium_Italic,
          Figtree_600SemiBold_Italic,
          Figtree_700Bold_Italic,
          Figtree_800ExtraBold_Italic,
          Figtree_900Black_Italic,
        }),
      ])
    } catch (error) {
      console.log(error)
      // crashlytics().recordError(error as Error)
      fontsError = true
    }

    if (fontsError) {
      setError(true)
    } else {
      setReady(true)
    }
  }

  useEffect(() => {
    // crashlytics().log('App mounted.')
    onLaunch()
  }, [])

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error
  }, [error])

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync()
    }
  }, [ready])

  const NotReady = () => {
    // [Tip]
    // You can show loading state here.
    return <></>
  }

  if (!ready) {
    return <NotReady />
  }

  return <RootLayoutNav />
}

function RootLayoutNav() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={getNavigationTheme()}>
          <I18nProvider i18n={i18n}>
            <StatusBar style={getStatusBarStyle()} />
            <GestureHandlerRootView style={{ flex: 1 }}>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

                <Stack.Screen
                  name="alphabet/[letter]"
                  /*getId={() => String(Date.now())}*/ options={{
                    title: '',
                    headerTransparent: true,
                    headerBackButtonDisplayMode: 'minimal',
                  }}
                />

                <Stack.Screen
                  name="unit/[id]"
                  /*getId={() => String(Date.now())}*/ options={{
                    title: '',
                    // headerShown: false,
                    headerBackButtonDisplayMode: 'minimal',
                    headerTransparent: true,
                  }}
                />

                <Stack.Screen
                  name="lesson/[id]"
                  /*getId={() => String(Date.now())}*/ options={{
                    title: '',
                    // headerShown: false,
                    headerBackButtonDisplayMode: 'minimal',
                    headerBackTitle: '',
                    headerTransparent: true,
                  }}
                />

                <Stack.Screen
                  name="word/[id]"
                  /*getId={() => String(Date.now())}*/ options={{
                    // title: '',
                    // headerShown: false,
                    headerTransparent: true,
                  }}
                />
                <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
                <Stack.Screen name="terms-and-conditions" options={{ title: '' }} />
              </Stack>
            </GestureHandlerRootView>
          </I18nProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}
