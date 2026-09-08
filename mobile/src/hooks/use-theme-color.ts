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
 *
 * These were still the pre-Laterite palette: a purple primary (`#6200EE` / `#BB86FC`)
 * and a cool grey secondary, none of which exist anywhere else in the app any more. The
 * placeholder in the dictionary search field and the keyboard pad was reading that grey
 * — a fourth colour, in a system that has three.
 */
const TOKENS = {
  light: {
    foregroundSecondary: '#6B5A4E',
    foreground: '#221913',
    primary: '#221913',
    primaryForeground: '#F4EBDD',
    accent: '#C4451C',
  },
  dark: {
    foregroundSecondary: 'rgba(244, 235, 221, 0.7)',
    foreground: '#F4EBDD',
    primary: '#F4EBDD',
    primaryForeground: '#221913',
    accent: '#E07A55',
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

/** The label that reads on `usePrimaryColor`, matching `text-primary-foreground`. */
export function usePrimaryForegroundColor() {
  return useThemeColors().primaryForeground
}

/** Laterite, matching `text-accent` / `bg-accent`. */
export function useAccentColor() {
  return useThemeColors().accent
}
