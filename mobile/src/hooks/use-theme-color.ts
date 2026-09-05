import { useColorScheme } from 'react-native'

/**
 * Theme-aware colour values for the handful of React Native props that take a colour
 * string rather than a class name.
 *
 * Everything else in the app is styled with Uniwind classes, which resolve tokens per
 * theme automatically. A few RN props — `placeholderTextColor`, `selectionColor`,
 * `tintColor` — cannot take a class, so their values were hardcoded to the light-theme
 * hex. In dark mode `#6E6B7B` on the `#252538` card measures 2.89:1, below the 4.5:1
 * WCAG AA minimum for placeholder text; the dark token `#9B97A8` measures 5.27:1.
 *
 * Values mirror `src/global.css`. If a token changes there, change it here too — these
 * are the only copies, and they exist solely because the RN prop cannot read the token.
 */
const TOKENS = {
  light: {
    foregroundSecondary: '#6E6B7B',
    foreground: '#1E1B2E',
    primary: '#6200EE',
  },
  dark: {
    foregroundSecondary: '#9B97A8',
    foreground: '#E8E4F0',
    primary: '#BB86FC',
  },
} as const

export type ThemeColorName = keyof (typeof TOKENS)['light']

export function useThemeColors() {
  const scheme = useColorScheme()
  return TOKENS[scheme === 'dark' ? 'dark' : 'light']
}

/** The placeholder colour for `TextInput`, matching `text-foreground-secondary`. */
export function usePlaceholderColor() {
  return useThemeColors().foregroundSecondary
}

/**
 * The brand colour, matching `bg-primary`.
 *
 * AudioPlayButton needs this as a value rather than a class: it already sets its
 * disabled and playing backgrounds inline, and an inline `backgroundColor` of
 * `undefined` beat the `bg-primary` class, leaving a white icon on a transparent
 * circle -- an invisible button.
 */
export function usePrimaryColor() {
  return useThemeColors().primary
}
