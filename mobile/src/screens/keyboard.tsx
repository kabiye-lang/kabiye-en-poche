import { useState } from 'react'
import { Dimensions, Pressable, TextInput } from 'react-native'

import * as Clipboard from 'expo-clipboard'
import { useLocalSearchParams } from 'expo-router'

import { useLingui } from '@lingui/react/macro'

import { ArrowFatLinesUpIcon, ArrowFatLineUpIcon, BackspaceIcon, DotIcon, KeyReturnIcon } from '../components/icons'
import { Button, Text, View } from '../components/ui'
import { usePlaceholderColor } from '../hooks/use-theme-color'

// Characters unique to Kabiyè (IPA-derived letters not in standard Latin)
export const KABIYE_SPECIFIC = new Set(['ɖ', 'ɛ', 'ɣ', 'ɩ', 'ŋ', 'ɔ', 'ʋ', 'ñ'])

// Static alphabet list for keyboard (no database calls needed)
export const ALPHABET_LIST = [
  { id: 'a', caps: 'A' },
  { id: 'b', caps: 'B' },
  { id: 'c', caps: 'C' },
  { id: 'd', caps: 'D' },
  { id: 'ɖ', caps: 'Ɖ' },
  { id: 'e', caps: 'E' },
  { id: 'ɛ', caps: 'Ɛ' },
  { id: 'f', caps: 'F' },
  { id: 'g', caps: 'G' },
  { id: 'ɣ', caps: 'Ɣ' },
  { id: 'h', caps: 'H' },
  { id: 'i', caps: 'I' },
  { id: 'ɩ', caps: 'Ɩ' },
  { id: 'j', caps: 'J' },
  { id: 'k', caps: 'K' },
  { id: 'l', caps: 'L' },
  { id: 'm', caps: 'M' },
  { id: 'n', caps: 'N' },
  { id: 'ñ', caps: 'Ñ' },
  { id: 'ŋ', caps: 'Ŋ' },
  { id: 'o', caps: 'O' },
  { id: 'ɔ', caps: 'Ɔ' },
  { id: 'p', caps: 'P' },
  { id: 'r', caps: 'R' },
  { id: 's', caps: 'S' },
  { id: 't', caps: 'T' },
  { id: 'u', caps: 'U' },
  { id: 'ʋ', caps: 'Ʋ' },
  { id: 'v', caps: 'V' },
  { id: 'w', caps: 'W' },
  { id: 'y', caps: 'Y' },
  { id: 'z', caps: 'Z' },
]

const OTHER_CHARACTERS = [
  {
    id: '(',
    caps: '1',
  },
  {
    id: ':',
    caps: '2',
  },
  {
    id: ',',
    caps: '3',
  },
  {
    id: ';',
    caps: '4',
  },
  {
    id: '!',
    caps: '5',
  },
  {
    id: '?',
    caps: '6',
  },
  {
    id: '-',
    caps: '7',
  },
  {
    id: '+',
    caps: '8',
  },
  {
    id: '*',
    caps: '9',
  },
  {
    id: '=',
    caps: '0',
  },
  {
    id: ')',
    caps: '`',
  },
]

/**
 * Which character a key press produces.
 *
 * `capsLock` is the existing three-state shift (0 off, 1 once, 2 locked); `longPress` is
 * the Laterite addition and wins outright, because it is an explicit request for this
 * one capital. Extracted so it can be tested without mounting the screen.
 */
export function resolveKey(letter: { id: string; caps?: string }, capsLock: 0 | 1 | 2, longPress: boolean): string {
  const wantsCapital = longPress || capsLock > 0
  if (!wantsCapital) return letter.id
  return letter.caps || letter.id
}

export default function KeyboardScreen() {
  const placeholderColor = usePlaceholderColor()
  const { t } = useLingui()
  const [capsLock, setCapsLock] = useState<0 | 1 | 2>(0)
  // The alphabet and entry screens both offer "Write it", which means arriving here with
  // the letter or word already in the pad rather than typing it again.
  const { text } = useLocalSearchParams<{ text?: string }>()
  const [content, setContent] = useState(text ?? '')

  const changeText = (letter: Partial<(typeof ALPHABET_LIST)[0]>) => {
    setContent((oldContent) => oldContent + resolveKey(letter as { id: string; caps?: string }, capsLock, false))
    setCapsLock((capsLockOld) => (capsLockOld === 2 ? capsLockOld : 0))
  }

  /**
   * Long-press a key for its capital.
   *
   * Kabiyè capitalises where French does -- sentence openings and proper nouns -- so a
   * writer needs a capital every sentence or two, not in runs. Shift and caps lock are a
   * three-state machine (off / once / locked) serving a need that is almost always
   * "this one letter". Long-press answers it in one gesture and leaves shift in place
   * for anyone who prefers it, or who is writing a run of capitals.
   */
  const typeCapital = (letter: { id: string; caps: string }) => {
    setContent((oldContent) => oldContent + resolveKey(letter, capsLock, true))
  }
  const handleCopy = async () => {
    if (content.length > 0) await Clipboard.setStringAsync(content)
  }

  const buttonWidth = (Dimensions.get('screen').width - 10) / 11 - 4

  const renderButton = (letter: { id: string; caps: string }) => {
    const isKabiye = KABIYE_SPECIFIC.has(letter.id)
    return (
      <Button
        key={letter.id}
        variant="ghost"
        size="sm"
        className={`rounded-md !px-0 !py-0 ${isKabiye ? 'bg-primary/15' : 'bg-card'}`}
        style={{ width: buttonWidth, minWidth: buttonWidth, height: 35 }}
        onPress={() => changeText(letter)}
        onLongPress={() => typeCapital(letter)}
        delayLongPress={300}
        accessibilityLabel={capsLock > 0 ? letter.caps : letter.id}
        accessibilityHint={t`Long-press for the capital`}
        hitSlop={3}
      >
        <Text
          kabiye
          variant="lg"
          weight="light"
          className={`text-base ${isKabiye ? 'text-primary' : 'text-foreground'}`}
        >
          {capsLock > 0 ? letter.caps : letter.id}
        </Text>
      </Button>
    )
  }

  return (
    <View flex safeArea="top" className="bg-background">
      <View className="px-6 pt-2">
        <Text className="text-accent text-[13px] font-semibold uppercase tracking-[0.1em]">{t`Keyboard`}</Text>
        <View className="mt-1 flex-row items-center justify-between">
          <Text weight="semibold" className="text-foreground flex-1 text-[28px]">
            {t`Write in Kabiyè`}
          </Text>
          <View className="flex-row gap-2">
            <Pressable
              accessibilityRole="button"
              onPress={() => setContent('')}
              className="border-foreground rounded-full border-[1.5px] px-4 py-2"
            >
              <Text weight="semibold" className="text-foreground text-[15px]">{t`Clear`}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={handleCopy} className="bg-foreground rounded-full px-4 py-2">
              <Text weight="semibold" className="text-background text-[15px]">{t`Copy`}</Text>
            </Pressable>
          </View>
        </View>
      </View>
      <View flex className="justify-end">
        {/* The example prompt here used to read "Ɛsɔɔlaa! Ŋsɛɛ wiɖe?". Neither word is
            attested by any source in the merged lexicon, so the screen that teaches
            writing was itself displaying invented Kabiyè. An empty pad says "write
            here" without asserting anything. */}
        {/* TextInput directly above keyboard */}
        <View className="px-2.5">
          <TextInput
            value={content}
            editable={false}
            multiline
            // What is typed here is Kabiyè, so it gets the face that can draw it.
            className="border-border bg-card text-foreground font-kbp-regular max-h-[120px] min-h-[80px] w-full rounded-xl border p-2.5 text-base"
            placeholder={t`Type here...`}
            placeholderTextColor={placeholderColor}
          />
        </View>
        {/* Clear and Copy moved into the header; this row was a second set of the same
            two buttons. The note is what replaces the collapsible "How to use" panel --
            one line, always visible, saying the only thing that is not discoverable. */}
        <View className="mb-2 mt-3 flex-row items-center justify-between px-6">
          <Text className="text-foreground-secondary text-[13px]">{t`Long-press a letter for its capital`}</Text>
          <Text className="text-foreground-secondary text-[13px]">{t`${content.length} characters`}</Text>
        </View>

        {/* <KeyboardAccessoryView
          renderContent={() => (
            <> */}
        <View className="bg-progress-track p-1.5 pb-5">
          <View className="mt-2.5 flex-row flex-wrap justify-center gap-1">
            {OTHER_CHARACTERS.concat(ALPHABET_LIST).map((letter) => renderButton(letter))}
          </View>
          <View className="mt-2.5 flex-row flex-wrap justify-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="bg-card rounded-md"
              style={{ width: 50, minWidth: 50, height: 35 }}
              accessibilityLabel={capsLock === 2 ? t`Caps lock on` : capsLock === 1 ? t`Shift on` : t`Shift`}
              onPress={() => setCapsLock((capsLockOld) => (capsLockOld > 0 ? 0 : 1))}
              onLongPress={() => setCapsLock((capsLockOld) => (capsLockOld > 0 ? 0 : 2))}
              hitSlop={3}
            >
              {capsLock === 2 ? (
                <ArrowFatLinesUpIcon weight="fill" className="text-foreground" />
              ) : (
                <ArrowFatLineUpIcon weight={capsLock === 1 ? 'fill' : 'light'} className="text-foreground" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="bg-card rounded-md"
              style={{ width: 50, minWidth: 50, height: 35 }}
              accessibilityLabel={t`Period`}
              onPress={() => changeText({ id: '.' })}
              hitSlop={3}
            >
              <DotIcon className="text-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="bg-card rounded-md"
              style={{ width: 90, minWidth: 90, height: 35 }}
              onPress={() => changeText({ id: ' ' })}
              hitSlop={3}
            >
              <Text variant="body" weight="light" className="text-foreground">
                {t`Space`}
              </Text>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="bg-card rounded-md"
              style={{ width: 50, minWidth: 50, height: 35 }}
              accessibilityLabel={t`Backspace`}
              onPress={() => setContent((content) => content.substring(0, content.length - 1))}
              hitSlop={3}
            >
              <BackspaceIcon weight="light" className="text-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="bg-card rounded-md"
              style={{ width: 50, minWidth: 50, height: 35 }}
              accessibilityLabel={t`New line`}
              onPress={() => {
                changeText({ id: '\n' })
                setCapsLock(1)
              }}
              hitSlop={3}
            >
              <KeyReturnIcon weight="light" className="text-foreground" />
            </Button>
          </View>
        </View>
      </View>
    </View>
  )
}
