import type { BottomTabNavigationOptions } from 'expo-router/js-tabs'
import type { Theme } from 'expo-router/react-navigation'

import { DarkTheme, DefaultTheme } from 'expo-router/react-navigation'
import { StatusBarStyle } from 'expo-status-bar'

import { Appearance } from './types'

// =============
// | Uniwind Design System |
// =============

// Laterite palette, mirrored from the tokens in global.css.
//
// These exist because React Navigation themes and the markdown renderer take plain
// values, not classes -- they cannot read a CSS variable. Everything else in the app
// must use the semantic classes (bg-background, text-foreground, border-border) so the
// palette stays defined in exactly one place. Keep these in step with global.css.
export const brandColors = {
  primary: '#221913', // ink: the filled button, not the accent
  primaryDark: '#F4EBDD', // paper, when ink is the ground
  secondary: '#6B5A4E', // ink-quiet
  bgGrey: '#F4EBDD', // paper
  textDark: '#221913',
  accent: '#C4451C', // laterite
  textLight: '#F4EBDD',
}

export const brandThemeColors = {
  _black: '#221913', // ink
  _black2: '#2E241C', // recessed, on a dark ground
  _white: '#F4EBDD', // paper
  _white2: '#EADFCD', // paper-recessed
  _tintColorLight: '#C4451C', // laterite
  _tintColorDark: '#E07A55', // laterite, raised for contrast on ink
}

// Fonts used in MARKDOWN_STYLE. Bricolage Grotesque replaced both Figtree and IBM Plex
// Sans Hebrew in the Laterite direction; the keys keep their old spelling so this stays
// a one-file change.
const fonts = {
  fig3: 'BricolageGrotesque_400Regular',
  ibm6: 'BricolageGrotesque_600SemiBold',
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

// The tab bar is ink in both themes -- it is the one constant band on every screen, and
// it reads as the base the paper sits on rather than as another surface.
export const tabScreenDefaultOptions = (): BottomTabNavigationOptions => ({
  tabBarActiveTintColor: '#F4EBDD', // paper
  tabBarInactiveTintColor: 'rgba(244,235,221,0.55)',
  tabBarStyle: {
    backgroundColor: '#221913', // ink
    borderTopWidth: 0,
    elevation: 0,
  },
})

// Laterite has three colours, so letter *type* is no longer colour-coded -- four hues for
// grapheme/vowel/consonant/indication was a legend the learner had to hold, and it said
// nothing the label under each tile does not already say. What earns colour is the
// distinction the app exists to teach: whether French can write the letter at all.
export const LETTER_TYPE_COLORS = {
  grapheme: '#221913',
  vowel: '#221913',
  consonant: '#221913',
  indication: '#6B5A4E',
}

/** Letters French cannot write. These are the tiles that carry laterite. */
export const KABIYE_ONLY_TILE = '#C4451C'

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
