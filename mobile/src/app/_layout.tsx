import { useEffect, useState } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaListener, SafeAreaProvider } from 'react-native-safe-area-context'

import { Uniwind } from 'uniwind'

import '../global.css'
import 'intl-pluralrules'

import { useColorScheme } from 'react-native'

import { loadAsync } from 'expo-font'
import { router, SplashScreen, Stack } from 'expo-router'
import { ThemeProvider } from 'expo-router/react-navigation'
import { StatusBar } from 'expo-status-bar'

import {
  Andika_400Regular,
  Andika_400Regular_Italic,
  Andika_700Bold,
  Andika_700Bold_Italic,
} from '@expo-google-fonts/andika'
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
import { defineMessage as msg } from '@lingui/core/macro'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner-native'

import i18n, { I18nProvider } from '../i18n'
import { queryClient } from '../lib/query-client'
import { AppDarkTheme, AppDefaultTheme } from '../utils/design-system-nativewind'

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router'

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'index',
}

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(false)
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null)

  const onLaunch = async () => {
    let fontsError = false
    try {
      const [, onboardingResult] = await Promise.all([
        loadAsync({
          // Kabiyè's own letters; see the --font-kbp-* note in global.css.
          Andika_400Regular,
          Andika_400Regular_Italic,
          Andika_700Bold,
          Andika_700Bold_Italic,
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
        AsyncStorage.getItem('@kabiye_onboarding_complete'),
      ])
      setHasSeenOnboarding(onboardingResult === 'true')
    } catch (error) {
      // Log error for debugging (remove in production)
      console.error('Error in app layout:', error)
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    onLaunch()
  }, [])

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error
  }, [error])

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync()
      if (hasSeenOnboarding) {
        router.replace('/(tabs)')
      } else {
        router.replace('/(onboarding)')
      }
    }
  }, [ready, hasSeenOnboarding])

  if (!ready) {
    return <NotReady />
  }

  return <RootLayoutNav />
}

const NotReady = () => <></>

function RootLayoutNav() {
  const colorScheme = useColorScheme()
  return (
    <SafeAreaProvider>
      <SafeAreaListener
        onChange={({ insets }) => {
          Uniwind.updateInsets(insets)
        }}
      >
        <QueryClientProvider client={queryClient}>
          <ThemeProvider value={colorScheme === 'dark' ? AppDarkTheme : AppDefaultTheme}>
            <I18nProvider i18n={i18n}>
              <StatusBar style={'auto'} />
              <GestureHandlerRootView style={{ flex: 1 }}>
                <Stack>
                  <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
                  {/* The header is hidden here, but the detail screens pushed on top of this
                      one take their back button's accessibility label from its title. Without
                      one, VoiceOver announced the route group -- "(tabs)". */}
                  <Stack.Screen name="(tabs)" options={{ headerShown: false, title: i18n._(msg`Back`) }} />

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
                      title: '',
                      headerBackButtonDisplayMode: 'minimal',
                      headerBackTitle: '',
                      headerTransparent: true,
                    }}
                  />
                  <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
                  <Stack.Screen
                    name="terms-and-conditions"
                    options={{
                      title: i18n._(msg`Terms and Conditions`),
                      headerBackButtonDisplayMode: 'minimal',
                      headerTransparent: true,
                    }}
                  />
                  <Stack.Screen
                    name="privacy-policy"
                    options={{
                      title: i18n._(msg`Privacy Policy`),
                      headerBackButtonDisplayMode: 'minimal',
                      headerTransparent: true,
                    }}
                  />
                </Stack>
                <Toaster />
              </GestureHandlerRootView>
            </I18nProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaListener>
    </SafeAreaProvider>
  )
}
