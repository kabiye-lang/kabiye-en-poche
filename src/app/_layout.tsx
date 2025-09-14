import { useCallback, useEffect, useMemo, useState } from 'react'
import { I18nextProvider } from 'react-i18next'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

import '../global.css'
import 'intl-pluralrules'

import { useColorScheme } from 'react-native'

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

import i18n from '@/i18n'
import {
  configureDesignSystem,
  getNavigationTheme,
  getStatusBarBGColor,
  getStatusBarStyle,
} from '@/utils/design-system-nativewind'

// react-native-ui-lib config removed - using NativeWind instead

export default function RootLayout() {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(false)
  const colorScheme = useColorScheme()

  const onLaunch = useCallback(async () => {
    let fontsError = false
    configureDesignSystem()
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
  }, [])

  useEffect(() => {
    // crashlytics().log('App mounted.')
    onLaunch()
  }, [onLaunch])

  useEffect(() => {
    configureDesignSystem()
  }, [colorScheme])

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error
  }, [error])

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync()
    }
  }, [ready])

  const NotReady = useMemo(() => {
    // [Tip]
    // You can show loading state here.
    return <></>
  }, [])

  if (!ready) {
    return NotReady
  }

  return <RootLayoutNav />
}

function RootLayoutNav() {
  return (
    <ThemeProvider value={getNavigationTheme()}>
      <I18nextProvider i18n={i18n}>
        <StatusBar style={getStatusBarStyle()} backgroundColor={getStatusBarBGColor()} />
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

            <Stack.Screen
              name="alphabet/[letter]"
              /*getId={() => String(Date.now())}*/ options={{
                title: '',
                headerShown: false,
                headerTransparent: true,
              }}
            />

            <Stack.Screen
              name="unit/[id]"
              /*getId={() => String(Date.now())}*/ options={{
                title: '',
                // headerShown: false,
                headerBackTitle: '',
                headerTransparent: true,
              }}
            />

            <Stack.Screen
              name="lesson/[id]"
              /*getId={() => String(Date.now())}*/ options={{
                title: '',
                // headerShown: false,
                headerBackTitle: '',
                headerTransparent: false,
              }}
            />

            <Stack.Screen
              name="word/[id]"
              /*getId={() => String(Date.now())}*/ options={{
                // title: '',
                // headerShown: false,
                headerTransparent: false,
              }}
            />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
            <Stack.Screen name="terms-and-conditions" options={{ title: '' }} />
          </Stack>
        </GestureHandlerRootView>
      </I18nextProvider>
    </ThemeProvider>
  )
}
