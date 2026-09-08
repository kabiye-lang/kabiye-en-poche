import { useEffect, useRef, useState } from 'react'
import { Dimensions, Modal, Pressable, ScrollView, TextInput, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import * as Clipboard from 'expo-clipboard'
import { useLocalSearchParams } from 'expo-router'

import { useLingui } from '@lingui/react/macro'

import {
  ArrowFatLinesUpIcon,
  ArrowFatLineUpIcon,
  BackspaceIcon,
  DotIcon,
  InfoIcon,
  KeyReturnIcon,
  XIcon,
} from '../components/icons'
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
  const [showHelp, setShowHelp] = useState(false)
  const [justCopied, setJustCopied] = useState(false)
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
  /**
   * Copy, and say so.
   *
   * The clipboard gives no sign it took anything, and this pad exists to be emptied into
   * another app -- a message, a form, a document. A learner who is not sure the copy
   * worked taps again, or retypes. The label carries the confirmation because it is
   * already where the thumb is looking.
   */
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(function cancelCopyConfirmationOnUnmount() {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current)
    }
  }, [])

  const handleCopy = async () => {
    if (content.length === 0) return
    await Clipboard.setStringAsync(content)
    setJustCopied(true)
    if (copyTimer.current) clearTimeout(copyTimer.current)
    copyTimer.current = setTimeout(() => setJustCopied(false), 1800)
  }

  const buttonWidth = (Dimensions.get('screen').width - 10) / 11 - 4

  /**
   * One key.
   *
   * A plain `Pressable`, not a `Button`: `Button` wraps its children in a `Text` of its
   * own carrying the size variant's padding, and inside a key pinned to 35x31 that left
   * no room for the glyph -- the whole tray rendered as blank tiles. A key is not a
   * button in this design system anyway (`radius 6-8px`, no pill), and the Spell step's
   * tray is built the same way.
   */
  const renderButton = (letter: { id: string; caps: string }) => {
    const isKabiye = KABIYE_SPECIFIC.has(letter.id)
    return (
      <Pressable
        key={letter.id}
        accessibilityRole="button"
        accessibilityLabel={capsLock > 0 ? letter.caps : letter.id}
        accessibilityHint={t`Long-press for the capital`}
        onPress={() => changeText(letter)}
        onLongPress={() => typeCapital(letter)}
        delayLongPress={300}
        hitSlop={3}
        /* Laterite, not `primary`. `primary` is ink in light and paper in dark, so the
           wash that marked these keys as special went dark on a light tray and light on
           a dark one -- the same eight keys reading as two different ideas depending on
           the theme. The accent is the colour this system already spends on "a letter
           French cannot write"; the glyph stays ink so the contrast holds at 17px. */
        className={`items-center justify-center rounded-md ${isKabiye ? 'bg-accent/20' : 'bg-card'}`}
        style={{ width: buttonWidth, minWidth: buttonWidth, height: 35 }}
      >
        <Text kabiye weight={isKabiye ? 'bold' : 'regular'} className="text-foreground text-[17px]">
          {capsLock > 0 ? letter.caps : letter.id}
        </Text>
      </Pressable>
    )
  }

  return (
    <View flex safeArea="top" className="bg-background">
      <View className="px-6 pt-2">
        {/* Clear and Copy used to sit at the top of a screen whose every other control is
            at the bottom -- a thumb reaching for them left the keyboard entirely. They
            act on the pad, so they now live beside it. What replaces them is the one
            thing that does belong up here: the explanation of a keyboard whose rules are
            not the phone's. It rides the section-label line, which was empty across its
            whole width, so the title keeps a full line and does not wrap in either
            interface language. */}
        <View className="flex-row items-center justify-between gap-3">
          <Text className="text-accent text-[13px] font-semibold uppercase tracking-[0.1em]">{t`Keyboard`}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t`How this keyboard works`}
            onPress={() => setShowHelp(true)}
            hitSlop={10}
            className="border-foreground -mr-1 flex-row items-center gap-1.5 rounded-full border-[1.5px] px-3.5 py-1.5"
          >
            <InfoIcon size={15} className="text-foreground" />
            <Text weight="semibold" className="text-foreground text-[14px]">{t`How it works`}</Text>
          </Pressable>
        </View>
        <Text weight="semibold" className="text-foreground mt-1 text-[28px]">
          {t`Write in Kabiyè`}
        </Text>
      </View>
      <View flex className="justify-end">
        {/* The example prompt here used to read "Ɛsɔɔlaa! Ŋsɛɛ wiɖe?". Neither word is
            attested by any source in the merged lexicon, so the screen that teaches
            writing was itself displaying invented Kabiyè. An empty pad says "write
            here" without asserting anything. */}
        {/* The pad takes the height rather than leaving it blank. Capped at 120px it sat
            just above the tray with roughly a third of the screen empty over it, which
            read as a layout that had lost something. Filling the space also says what
            the pad is for: a sheet to write on, not a one-line field. */}
        <View flex className="justify-end px-2.5 pt-3">
          <TextInput
            value={content}
            editable={false}
            multiline
            textAlignVertical="top"
            // What is typed here is Kabiyè, so it gets the face that can draw it.
            className="border-border bg-card text-foreground font-kbp-regular min-h-[80px] w-full flex-1 rounded-xl border p-3.5 text-base"
            placeholder={t`Type here...`}
            placeholderTextColor={placeholderColor}
          />
        </View>
        {/* Clear and Copy, against the pad they act on. Both fade rather than vanish when
            there is nothing to act on: a control that disappears makes the row jump and
            leaves the learner wondering what they did. */}
        <View className="mb-2 mt-3 flex-row items-center justify-between gap-3 px-6">
          <Text className="text-foreground-secondary flex-1 text-[13px]">
            {content.length === 1 ? t`1 character` : t`${content.length} characters`}
          </Text>
          <View className="flex-row items-center gap-2">
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: content.length === 0 }}
              disabled={content.length === 0}
              onPress={() => setContent('')}
              className={`border-foreground rounded-full border-[1.5px] px-4 py-2 ${content.length === 0 ? 'opacity-40' : ''}`}
            >
              <Text weight="semibold" className="text-foreground text-[15px]">{t`Clear`}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: content.length === 0 }}
              disabled={content.length === 0}
              onPress={handleCopy}
              /* A floor under the width so the confirmation does not resize the button
                 and shove Clear sideways as it appears. */
              className={`bg-foreground min-w-[92px] items-center rounded-full px-4 py-2 ${content.length === 0 ? 'opacity-40' : ''}`}
            >
              <Text weight="semibold" className="text-background text-[15px]">
                {justCopied ? t`Copied` : t`Copy`}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* <KeyboardAccessoryView
          renderContent={() => (
            <> */}
        {/* `bg-progress-track` is the divider colour; the tray is a surface, and the
            system's recessed tone is what a surface under the page is made of. */}
        <View className="bg-background-tertiary p-1.5 pb-5">
          <View className="mt-2.5 flex-row flex-wrap justify-center gap-1">
            {OTHER_CHARACTERS.concat(ALPHABET_LIST).map((letter) => renderButton(letter))}
          </View>
          <View className="mt-2.5 flex-row flex-wrap justify-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="bg-card rounded-md px-0 py-0"
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
              className="bg-card rounded-md px-0 py-0"
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
              className="bg-card rounded-md px-0 py-0"
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
              className="bg-card rounded-md px-0 py-0"
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
              className="bg-card rounded-md px-0 py-0"
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

      <KeyboardHelpSheet visible={showHelp} onClose={() => setShowHelp(false)} />
    </View>
  )
}

/**
 * What this keyboard does that a phone keyboard does not.
 *
 * Three of its four rules are invisible: that the tinted keys are the letters French
 * cannot write, that a long press gives a capital, and that a long press on shift locks
 * it. They were compressed into a single line under the pad, which said only the second
 * of them and cost that line on every visit for a fact a learner needs once. A sheet
 * behind a named trigger says all four, and says them fully.
 */
const KeyboardHelpSheet: React.FC<{
  visible: boolean
  onClose: () => void
}> = ({ visible, onClose }) => {
  const { t } = useLingui()
  const insets = useSafeAreaInsets()
  const { height } = useWindowDimensions()

  const rules: {
    key: string
    title: string
    body: string
    letters?: string
  }[] = [
    {
      key: 'tinted',
      title: t`The tinted keys`,
      // Set on their own line rather than inside the sentence: React Native applies one
      // face per Text node, so a sentence carrying these letters would set its English
      // in Andika too.
      letters: 'ɖ ɛ ɣ ɩ ŋ ɔ ʋ ñ',
      body: t`The letters a French keyboard has no key for.`,
    },
    {
      key: 'capital',
      title: t`Long-press a letter for its capital`,
      body: t`Kabiyè capitalises where French does: sentence openings, and names.`,
    },
    {
      key: 'shift',
      title: t`Shift, and caps lock`,
      body: t`Tap shift for the next letter only. Long-press it to lock.`,
    },
    {
      key: 'copy',
      title: t`Copy takes it with you`,
      body: t`What you write goes to the clipboard, to paste into any other app.`,
    },
  ]

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Tapping the scrim closes, as a sheet should. It carries no label of its own --
          the close button below is the one an assistive technology should find. */}
      <Pressable
        accessible={false}
        importantForAccessibility="no"
        onPress={onClose}
        className="bg-scrim flex-1 justify-end"
      >
        {/* A second Pressable swallows taps on the sheet itself, which would otherwise
            fall through to the scrim and close it mid-read. */}
        <Pressable accessible={false} onPress={() => {}}>
          {/* Capped at three quarters of the screen and padded past the home indicator.
              A fixed 420px scroller under a header overran the bottom edge, so the last
              rule was cut off by the screen rather than ending inside the sheet. */}
          <View
            className="bg-card border-foreground rounded-t-[20px] border-t-[1.5px] px-6 pt-6"
            style={{ paddingBottom: insets.bottom + 24 }}
          >
            <View className="flex-row items-start justify-between gap-3">
              <View flex>
                <Text className="text-accent text-[13px] font-semibold uppercase tracking-[0.1em]">{t`Keyboard`}</Text>
                <Text weight="semibold" className="text-foreground mt-1 text-[28px] leading-[1.1]">
                  {t`How it works`}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t`Close`}
                onPress={onClose}
                hitSlop={12}
                /* A border, because in dark the recessed tone and the card tone are the
                   same value and the button had no edge at all. */
                className="bg-background-tertiary border-border mt-1 h-9 w-9 items-center justify-center rounded-full border"
              >
                <XIcon size={18} className="text-foreground" />
              </Pressable>
            </View>

            {/* A pixel ceiling, not a percentage: a percentage height resolves against a
                parent that has none here, and clipped the last rule mid-word. */}
            <ScrollView className="mt-5" style={{ maxHeight: height * 0.58 }} showsVerticalScrollIndicator={false}>
              {rules.map((rule, index) => (
                <View key={rule.key} className={index === 0 ? '' : 'border-border mt-5 border-t pt-5'}>
                  <Text weight="semibold" className="text-foreground text-[17px]">
                    {rule.title}
                  </Text>
                  {rule.letters ? (
                    <Text kabiye weight="bold" className="text-accent mt-2 text-[24px] leading-[1.2]">
                      {rule.letters}
                    </Text>
                  ) : null}
                  <Text className="text-foreground-secondary mt-1 text-[15px] leading-[1.45]">{rule.body}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
