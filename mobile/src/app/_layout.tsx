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
  BricolageGrotesque_300Light,
  BricolageGrotesque_400Regular,
  BricolageGrotesque_500Medium,
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque'
import { defineMessage as msg } from '@lingui/core/macro'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner-native'

import { useAppearance } from '../hooks/use-appearance'
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
          // The interface face. Bricolage Grotesque ships no italic, so the
          // `--font-*-italic` tokens in global.css point at the upright of the same
          // weight rather than letting the OS synthesise a slant.
          BricolageGrotesque_300Light,
          BricolageGrotesque_400Regular,
          BricolageGrotesque_500Medium,
          BricolageGrotesque_600SemiBold,
          BricolageGrotesque_700Bold,
          BricolageGrotesque_800ExtraBold,
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
  const systemScheme = useColorScheme()
  // The Appearance setting overrides the system. React Navigation's theme and the status
  // bar are outside Uniwind's stylesheet, so they have to be told separately -- without
  // this, choosing Dark left every pushed header and the clock light on a dark screen.
  const { appearance } = useAppearance()
  const isDark = appearance === 'system' ? systemScheme === 'dark' : appearance === 'dark'

  return (
    <SafeAreaProvider>
      <SafeAreaListener
        onChange={({ insets }) => {
          Uniwind.updateInsets(insets)
        }}
      >
        <QueryClientProvider client={queryClient}>
          <ThemeProvider value={isDark ? AppDarkTheme : AppDefaultTheme}>
            <I18nProvider i18n={i18n}>
              <StatusBar style={isDark ? 'light' : 'dark'} />
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
