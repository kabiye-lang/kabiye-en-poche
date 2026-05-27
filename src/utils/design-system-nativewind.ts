import type { BottomTabNavigationOptions } from 'expo-router/js-tabs'
import type { Theme } from 'expo-router/react-navigation'

import { DarkTheme, DefaultTheme } from 'expo-router/react-navigation'
import { StatusBarStyle } from 'expo-status-bar'

import { Appearance } from './types'

// =============
// | Uniwind Design System |
// =============

// Brand colors - used in navigation themes only (not in components — use CSS vars)
export const brandColors = {
  primary: '#6200EE',
  primaryDark: '#BB86FC',
  secondary: '#8B5CF6',
  bgGrey: '#F5F3F7',
  textDark: '#1E1B2E',
  accent: '#BF3626',
  textLight: '#FFFFFF',
}

export const brandThemeColors = {
  _black: '#1E1B2E',
  _black2: '#1A1A2E',
  _white: '#F5F3F7',
  _white2: '#EDE9F0',
  _tintColorLight: '#6200EE',
  _tintColorDark: '#BB86FC',
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

// ==============
// | Navigation |
// ==============
export const getStatusBarStyle = (): StatusBarStyle => {
  return 'auto'
}

export const AppDefaultTheme: Theme = {
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

export const AppDarkTheme: Theme = {
  dark: true,
  colors: {
    ...DarkTheme.colors,
    primary: brandColors.primaryDark,
    background: themes.dark.bgColor,
    card: themes.dark.bgColor,
    text: themes.dark.textColor,
  },
  fonts: DefaultTheme.fonts,
}

export const tabScreenDefaultOptions = (): BottomTabNavigationOptions => ({
  tabBarActiveTintColor: brandColors.primary,
  tabBarInactiveTintColor: '#6E6B7B',
  tabBarStyle: { backgroundColor: themes.light.bgColor, borderTopWidth: 0, elevation: 0 },
})

export const LETTER_TYPE_COLORS = {
  grapheme: '#6200EE',
  vowel: '#C8922A',
  consonant: '#0766AD',
  indication: '#6B5E4F',
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
