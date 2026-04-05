import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs'
import type { Theme } from '@react-navigation/native'

import { StatusBarStyle } from 'expo-status-bar'

import { DarkTheme, DefaultTheme } from '@react-navigation/native'

import { Appearance } from './types'

// =============
// | Uniwind Design System |
// =============

// Brand colors - used in navigation themes only (not in components — use CSS vars)
export const brandColors = {
  primary: '#1B6B3C',
  primaryDark: '#4CAF74',
  secondary: '#C8922A',
  bgGrey: '#FBF7F0',
  textDark: '#2C2417',
  accent: '#BF3626',
  textLight: '#FFFFFF',
}

export const brandThemeColors = {
  _black: '#2C2417',
  _black2: '#1A1714',
  _white: '#FBF7F0',
  _white2: '#F3EDE3',
  _tintColorLight: '#1B6B3C',
  _tintColorDark: '#4CAF74',
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
  tabBarInactiveTintColor: '#6B5E4F',
  tabBarStyle: { backgroundColor: themes.light.bgColor, borderTopWidth: 0, elevation: 0 },
})

export const LETTER_TYPE_COLORS = {
  grapheme: '#1B6B3C',
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
