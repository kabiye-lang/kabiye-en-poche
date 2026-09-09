import { Pressable } from 'react-native'

import { useLingui } from '@lingui/react/macro'

import { Text, View } from './ui'

/**
 * Marks a gloss that is not the dictionary's own wording in the reader's language.
 *
 * Two cases. A gloss in the *other* language, shown because there is nothing else:
 * `fɛŋgɛ / léger(ère) sans poids` read as a broken translation until the tag said "FR".
 * And a gloss the pipeline *translated* into the reader's language: the tag says so, and
 * on the word screen it is the control that swaps the translation for the original and
 * back. Deliberately quiet either way -- caption weight, secondary colour -- because it
 * is a footnote about the text, not part of it.
 */
export const LanguageTag = ({
  language,
  machine = false,
  showingOriginal = false,
  onPress,
}: {
  language: 'fr' | 'en'
  /** The text is a machine translation (into `language`'s counterpart) of the dictionary's gloss. */
  machine?: boolean
  /** With `onPress`: the original is currently shown, so the tag names its language. */
  showingOriginal?: boolean
  onPress?: () => void
}) => {
  const { t } = useLingui()
  const label = machine
    ? showingOriginal
      ? t`original · ${language.toUpperCase()}`
      : t`translated`
    : language.toUpperCase()
  const body = (
    <View
      className={
        onPress
          ? 'border-border self-start rounded border px-1.5 py-0.5'
          : 'bg-background-tertiary self-start rounded px-1.5 py-0.5'
      }
    >
      <Text
        variant="small"
        weight="medium"
        className={machine ? 'text-foreground-secondary' : 'text-foreground-secondary uppercase'}
      >
        {label}
      </Text>
    </View>
  )
  if (!onPress) return body
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={showingOriginal ? t`Show the translation` : t`Show the original wording`}
      hitSlop={8}
      onPress={onPress}
    >
      {body}
    </Pressable>
  )
}
