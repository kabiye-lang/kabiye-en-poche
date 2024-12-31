import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs'
import type { Theme } from '@react-navigation/native'
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack'
import type { Animated, StyleProp, TextStyle } from 'react-native'
import type { ButtonProps, TextProps } from 'react-native-ui-lib'

import { Platform, Appearance as RNAppearance } from 'react-native'
import { Assets, Colors, ThemeManager, Typography } from 'react-native-ui-lib'

import { StatusBarStyle } from 'expo-status-bar'

import { DarkTheme, DefaultTheme } from '@react-navigation/native'

import { Appearance } from '@/utils/types'

// We don't use mobx for now
const stores: { ui: { isAppearanceSystem: boolean; appearance: Appearance } } = {
  ui: { isAppearanceSystem: true, appearance: 'system' },
}

// =============
// | RN UI Lib |
// =============

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
  _black: Colors.rgba(20, 20, 20, 1),
  _black2: Colors.rgba(50, 50, 50, 1),
  _white: Colors.rgba(250, 250, 250, 1),
  _white2: Colors.rgba(230, 230, 230, 1),
  _tintColorLight: '#2f95dc',
  _tintColorDark: '#fff',
}

export const fonts = {
  ibm1: 'IBMPlexSansHebrew_100Thin',
  ibm2: 'IBMPlexSansHebrew_200ExtraLight',
  ibm3: 'IBMPlexSansHebrew_300Light',
  ibm4: 'IBMPlexSansHebrew_400Regular',
  ibm5: 'IBMPlexSansHebrew_500Medium',
  ibm6: 'IBMPlexSansHebrew_600SemiBold',
  ibm7: 'IBMPlexSansHebrew_700Bold',
  fig3: 'Figtree_300Light',
  fig3i: 'Figtree_300Light_Italic',
  fig4: 'Figtree_400Regular',
  fig4i: 'Figtree_400Regular_Italic',
  fig5: 'Figtree_500Medium',
  fig5i: 'Figtree_500Medium_Italic',
  fig6: 'Figtree_600SemiBold',
  fig6i: 'Figtree_600SemiBold_Italic',
  fig7: 'Figtree_700Bold',
  fig7i: 'Figtree_700Bold_Italic',
  fig8: 'Figtree_800ExtraBold',
  fig8i: 'Figtree_800ExtraBold_Italic',
  fig9: 'Figtree_900Black',
  fig9i: 'Figtree_900Black_Italic',
}

const typographies = {
  h1: { fontSize: 36, lineHeight: 42 },
  h2: { fontSize: 32, lineHeight: 40 },
  h3: { fontSize: 28, lineHeight: 36 },
  h4: { fontSize: 24, lineHeight: 32 },
  h5: { fontSize: 20, lineHeight: 28 },
  h6: { fontSize: 18, lineHeight: 24 },
  lg: { fontSize: 16, lineHeight: 22 },
  normal: { fontSize: 14, lineHeight: 16 },
  sm: { fontSize: 12, lineHeight: 15 },
  xs: { fontSize: 10, lineHeight: 13 },
}

export type CustomTypographyProps = {
  family?: keyof typeof fonts
} & Partial<Record<keyof typeof typographies, boolean>>

export function combineStyles<T>(...styles: StyleProp<T>[]) {
  let combinedStyles: StyleProp<T>[] = []

  styles.forEach((style) => {
    if (style) {
      combinedStyles = combinedStyles.concat(style)
    }
  })

  // console.log(combinedStyles)
  return combinedStyles
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

// for more information - https://wix.github.io/react-native-ui-lib/foundation/style
export const configureDesignSystem = async (): PVoid => {
  const { ui } = stores

  setColorsScheme(ui.appearance) // needed here
  if (ui.isAppearanceSystem) {
    Colors.loadColors(brandColors)
    // Colors.loadSchemes(themes)
    Colors.loadSchemes({ dark: { ...themes.dark }, light: { ...themes.light } })
  } else {
    Colors.loadColors({ ...brandColors, ...themes[ui.appearance] })
    Colors.loadSchemes({ dark: {}, light: {} })
  }

  Typography.loadTypographies(typographies)
  ThemeManager.setComponentTheme(
    'Button',
    (props: ButtonProps & Pick<CustomTypographyProps, 'family'>): ButtonProps => {
      return {
        backgroundColor: brandColors.primary,
        ...props,
        labelStyle: combineStyles<TextStyle>(
          {
            fontFamily: fonts.fig5,
            // color: props.link ? '#000' : '#fff',
          },
          props.labelStyle,
          props.family && fonts[props.family] ? { fontFamily: fonts[props.family] } : {}
        ),
        style: [props.round ? false : { borderRadius: 8, paddingTop: 10, paddingBottom: 12 }, props.style],
      }
    }
  )

  ThemeManager.setComponentTheme('Text', (props: TextProps & CustomTypographyProps) => {
    // console.log(props.children)
    return {
      // color: text,
      ...props,
      style: combineStyles<StyleProp<TextStyle | Animated.AnimatedProps<TextStyle>>>(
        { fontFamily: fonts.fig3 },
        props.style,
        props.family && fonts[props.family] ? { fontFamily: fonts[props.family] } : {}
      ),
    }
  })
  // Assets
  Assets.loadAssetsGroup('illustrations', {})
}

const setColorsScheme = (appearance: Appearance) => {
  if (appearance === 'system') Colors.setScheme('default')
  else Colors.setScheme(appearance)
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
      primary: Colors.primary,
      background: Colors.bgColor,
      card: Colors.bgColor,
      text: Colors.textColor,
      // border: Colors.grey30,
      // notification: Colors.primary,
    },
    fonts: DefaultTheme.fonts,
  }

  const MyDarkTheme: Theme = {
    dark: true,
    colors: {
      ...DarkTheme.colors,
      primary: Colors.primary,
      background: Colors.bgColor,
      card: Colors.bgColor,
      text: Colors.textColor,
      // border: Colors.grey30,
      // notification: Colors.primary,
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

export const getHeaderBlurEffect = (): 'regular' | 'light' | 'dark' => {
  const { ui } = stores

  return ui.isAppearanceSystem ? 'regular' : (ui.appearance as 'light' | 'dark')
}

// Default options
export const screenDefaultOptions = (): NativeStackNavigationOptions => ({
  headerShadowVisible: false,
  headerTintColor: Colors.primary,

  // this setup makes large title work on iOS
  ...Platform.select({
    ios: {
      headerLargeTitle: true,
      headerTransparent: true,
      headerBlurEffect: getHeaderBlurEffect(), // this sets up blurred nav bar
      // if you'd like to have a solid color for a nav bar, then you should
      // set up `headerStyle: {backgroundColor: Colors.bg2Color}`
    },
  }),
})

export const tabScreenDefaultOptions = (): BottomTabNavigationOptions => ({
  tabBarActiveTintColor: Colors.primary,
  tabBarInactiveTintColor: Colors.grey40,
  tabBarStyle: { backgroundColor: Colors.bgColor, borderTopWidth: 0, elevation: 0 },
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
  // text: { /*fontFamily: fonts.fig3*/ fontSize: 16 },
  heading1: { fontFamily: fonts.ibm6 },
  heading2: { fontFamily: fonts.ibm6 },
  heading3: { fontFamily: fonts.ibm6, fontSize: 20 },
  heading4: { fontFamily: fonts.ibm6 },
}
