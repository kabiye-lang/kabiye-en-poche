import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs'
import type { Theme } from '@react-navigation/native'

import { Appearance as RNAppearance } from 'react-native'

import { StatusBarStyle } from 'expo-status-bar'

import { DarkTheme, DefaultTheme } from '@react-navigation/native'

import { Appearance } from './types'

// We don't use mobx for now
const stores: { ui: { isAppearanceSystem: boolean; appearance: Appearance } } = {
  ui: { isAppearanceSystem: true, appearance: 'system' },
}

// =============
// | NativeWind Design System |
// =============

// Brand colors - used in navigation themes
export const brandColors = {
  primary: '#6200EE',
  secondary: '#03DAC6',
  bgGrey: '#F5F5F5',
  textDark: '#212121',
  accent: '#FF5722',
  textLight: '#FFFFFF',
  textGrey: '#757575',
}

export const brandThemeColors = {
  _black: 'rgba(20, 20, 20, 1)',
  _black2: 'rgba(50, 50, 50, 1)',
  _white: 'rgba(250, 250, 250, 1)',
  _white2: 'rgba(230, 230, 230, 1)',
  _tintColorLight: '#2f95dc',
  _tintColorDark: '#fff',
}

// Fonts used in MARKDOWN_STYLE
const fonts = {
  fig3: 'Figtree_300Light',
  ibm6: 'IBMPlexSansHebrew_600SemiBold',
}

const themes: Record<Appearance, ThemeColors> = {
  system: {
    textColor: brandThemeColors._black ?? '',
    bgColor: brandThemeColors._white ?? '',
    bg2Color: brandThemeColors._white2 ?? '',
  },
  light: {
    textColor: brandThemeColors._black ?? '',
    bgColor: brandThemeColors._white ?? '',
    bg2Color: brandThemeColors._white2 ?? '',
  },
  dark: {
    textColor: brandThemeColors._white ?? '',
    bgColor: brandThemeColors._black ?? '',
    bg2Color: brandThemeColors._black2 ?? '',
  },
}

// NativeWind-compatible design system configuration
export const configureDesignSystem = (): void => {
  // NativeWind handles colors and typography through Tailwind config
  // This function is kept for compatibility but doesn't need to do much
  console.log('Design system configured for NativeWind')
}

// ==============
// | Navigation |
// ==============
export const getStatusBarStyle = (): StatusBarStyle => {
  const { ui } = stores

  if (ui.isAppearanceSystem) {
    return 'auto'
  } else {
    switch (ui.appearance) {
      case 'dark':
        return 'light'
      case 'light':
        return 'dark'
      default:
        return 'auto'
    }
  }
}

export const getStatusBarBGColor = (): string => {
  const { ui } = stores
  const appearance = ui.isAppearanceSystem ? RNAppearance.getColorScheme() : ui.appearance
  return themes[appearance ?? 'light'].bg2Color
}

export const getNavigationTheme = (): Theme => {
  const { ui } = stores

  // for more information - https://docs.expo.dev/routing/appearance/
  const MyDefaultTheme: Theme = {
    dark: false,
    colors: {
      ...DefaultTheme.colors,
      primary: brandColors.primary,
      background: themes.light.bgColor,
      card: themes.light.bgColor,
      text: themes.light.textColor,
    },
    fonts: DefaultTheme.fonts,
  }

  const MyDarkTheme: Theme = {
    dark: true,
    colors: {
      ...DarkTheme.colors,
      primary: brandColors.primary,
      background: themes.dark.bgColor,
      card: themes.dark.bgColor,
      text: themes.dark.textColor,
    },
    fonts: DefaultTheme.fonts,
  }

  const appearance = ui.isAppearanceSystem ? RNAppearance.getColorScheme() : ui.appearance
  switch (appearance) {
    case 'dark':
      return MyDarkTheme
    case 'light':
      return MyDefaultTheme
  }

  return DefaultTheme
}

export const tabScreenDefaultOptions = (): BottomTabNavigationOptions => ({
  tabBarActiveTintColor: brandColors.primary,
  tabBarInactiveTintColor: '#9CA3AF',
  tabBarStyle: { backgroundColor: themes.light.bgColor, borderTopWidth: 0, elevation: 0 },
})

export const LETTER_TYPE_COLORS = {
  grapheme: '#7577CD',
  vowel: '#29ADB2',
  consonant: '#0766AD',
  indication: '#968C83',
}

export const MARKDOWN_STYLE = {
  body: { fontFamily: fonts.fig3 },
  strong: { fontFamily: fonts.ibm6 },
  heading1: { fontFamily: fonts.ibm6 },
  heading2: { fontFamily: fonts.ibm6 },
  heading3: { fontFamily: fonts.ibm6, fontSize: 20 },
  heading4: { fontFamily: fonts.ibm6 },
}

// Type definitions
interface ThemeColors {
  textColor: string
  bgColor: string
  bg2Color: string
}
