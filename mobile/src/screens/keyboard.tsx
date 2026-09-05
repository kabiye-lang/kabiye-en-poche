import { useEffect, useState } from 'react'
import { Dimensions, Pressable, TextInput } from 'react-native'

import * as Clipboard from 'expo-clipboard'

import { useLingui } from '@lingui/react/macro'
import AsyncStorage from '@react-native-async-storage/async-storage'

import {
  ArrowFatLinesUpIcon,
  ArrowFatLineUpIcon,
  BackspaceIcon,
  CaretDownIcon,
  CaretUpIcon,
  DotIcon,
  KeyReturnIcon,
} from '../components/icons'
import { Button, ScreenTitle, Text, View } from '../components/ui'
import { usePlaceholderColor } from '../hooks/use-theme-color'

// Characters unique to Kabiyè (IPA-derived letters not in standard Latin)
const KABIYE_SPECIFIC = new Set(['ɖ', 'ɛ', 'ɣ', 'ɩ', 'ŋ', 'ɔ', 'ʋ', 'ñ'])

// Static alphabet list for keyboard (no database calls needed)
const ALPHABET_LIST = [
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

export default function KeyboardScreen() {
  const placeholderColor = usePlaceholderColor()
  const { t } = useLingui()
  const [capsLock, setCapsLock] = useState<0 | 1 | 2>(0)
  const [content, setContent] = useState('')
  const [showHint, setShowHint] = useState(true)

  useEffect(() => {
    AsyncStorage.getItem('keyboard_hint_count').then((val) => {
      const count = parseInt(val || '0', 10)
      if (count >= 3) setShowHint(false)
      else AsyncStorage.setItem('keyboard_hint_count', String(count + 1))
    })
  }, [])

  const changeText = (letter: Partial<(typeof ALPHABET_LIST)[0]>) => {
    setContent((oldContent) => oldContent + (capsLock ? letter.caps || letter.id : letter.id))
    setCapsLock((capsLockOld) => (capsLockOld === 2 ? capsLockOld : 0))
  }
  const buttonWidth = (Dimensions.get('screen').width - 10) / 11 - 4

  const renderButton = (letter: { id: string; caps: string }) => {
  const placeholderColor = usePlaceholderColor()
    const isKabiye = KABIYE_SPECIFIC.has(letter.id)
    return (
      <Button
        key={letter.id}
        variant="ghost"
        size="sm"
        className={`rounded-md !px-0 !py-0 ${isKabiye ? 'bg-primary/15' : 'bg-card'}`}
        style={{ width: buttonWidth, minWidth: buttonWidth, height: 35 }}
        onPress={() => changeText(letter)}
        hitSlop={3}
      >
        <Text
          variant="lg"
          weight="regular"
          className={`font-fig-light text-base ${isKabiye ? 'text-primary' : 'text-foreground'}`}
        >
          {capsLock > 0 ? letter.caps : letter.id}
        </Text>
      </Button>
    )
  }

  return (
    <View flex className="bg-background">
      <View className="px-2.5">
        <ScreenTitle title={t`Keyboard`} />
        {/* Collapsible hint */}
        <Pressable onPress={() => setShowHint(!showHint)} className="mb-2 flex-row items-center">
          <Text variant="caption" weight="medium" className="text-foreground-secondary">
            {t`How to use`}
          </Text>
          {showHint ? (
            <CaretUpIcon size={14} className="text-foreground-secondary ml-1" />
          ) : (
            <CaretDownIcon size={14} className="text-foreground-secondary ml-1" />
          )}
        </Pressable>
        {showHint && (
          <View className="mb-2">
            <Text variant="caption" className="text-foreground-secondary">
              {t`Use this keyboard to write in Kabiyè.`} {t`The`} <ArrowFatLineUpIcon weight="regular" size={12} />{' '}
              {t`key allows you to capitalize. Long press to lock CAPS mode.`}
            </Text>
          </View>
        )}
      </View>
      <View flex className="justify-end">
        {/* Example prompt */}
        <View className="mb-3 px-4">
          <Text variant="caption" className="text-foreground-secondary text-center italic">
            {t`Try typing:`} Ɛsɔɔlaa! Ŋsɛɛ wiɖe?
          </Text>
        </View>

        {/* TextInput directly above keyboard */}
        <View className="px-2.5">
          <TextInput
            value={content}
            editable={false}
            multiline
            className="border-border bg-card text-foreground max-h-[120px] min-h-[80px] w-full rounded-xl border p-2.5 text-base"
            placeholder={t`Type here...`}
            placeholderTextColor={placeholderColor}
          />
        </View>
        {/* Inline toolbar */}
        <View className="mt-2 mb-2 flex-row justify-center gap-2 px-2.5">
          <Button
            variant="outline"
            size="sm"
            className="rounded-md"
            style={{ width: 90, minWidth: 90, height: 35 }}
            onPress={() => setContent('')}
            hitSlop={3}
          >
            <Text variant="body" weight="medium" className="text-primary">
              {t`Clear`}
            </Text>
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="rounded-md"
            style={{ width: 90, minWidth: 90, height: 35 }}
            onPress={async () => await Clipboard.setStringAsync(content)}
            hitSlop={3}
          >
            <Text variant="body" weight="medium" className="text-white">
              {t`Copy`}
            </Text>
          </Button>
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
