import { useState } from 'react'
import { Dimensions, TextInput } from 'react-native'

import * as Clipboard from 'expo-clipboard'

import { useLingui } from '@lingui/react/macro'

import { ArrowFatLinesUpIcon, ArrowFatLineUpIcon, BackspaceIcon, DotIcon, KeyReturnIcon } from '@/components/icons'
import { Button, ScreenTitle, Text, View } from '@/components/ui'

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
  const { t } = useLingui()
  const [capsLock, setCapsLock] = useState<0 | 1 | 2>(0)
  const [content, setContent] = useState('')
  const changeText = (letter: Partial<(typeof ALPHABET_LIST)[0]>) => {
    setContent((oldContent) => oldContent + (capsLock ? letter.caps || letter.id : letter.id))
    setCapsLock((capsLockOld) => (capsLockOld === 2 ? capsLockOld : 0))
  }
  const buttonWidth = (Dimensions.get('screen').width - 10) / 11 - 5

  const renderButton = (letter: { id: string; caps: string }) => {
    return (
      <Button
        key={letter.id}
        variant="ghost"
        size="sm"
        className="bg-card rounded-md !px-0 !py-0"
        style={{ width: buttonWidth, minWidth: buttonWidth, height: 35 }}
        onPress={() => changeText(letter)}
      >
        <Text variant="lg" weight="regular" className="font-fig-light text-foreground text-base">
          {capsLock > 0 ? letter.caps : letter.id}
        </Text>
      </Button>
    )
  }

  return (
    <View flex className="bg-background">
      <View className="px-2.5">
        <ScreenTitle title={t`Keyboard`} />
        <Text variant="body" className="text-foreground mb-2">
          {t`Use this keyboard to write in Kabiyè.`}
        </Text>
        <Text variant="body" className="text-foreground mb-2">
          {t`The`} <ArrowFatLineUpIcon weight="regular" size={16} />{' '}
          {t`key allows you to capitalize. Long press to lock CAPS mode.`}
        </Text>
      </View>
      <View flex className="justify-end">
        <View className="px-2.5">
          <TextInput
            value={content}
            editable={false}
            multiline
            className="border-primary bg-card text-foreground max-h-[120px] min-h-[120px] w-full rounded-lg border p-2.5 text-base"
            placeholder="Type here..."
            placeholderTextColor="#9CA3AF"
          />
        </View>
        <View className="mt-5 mb-2.5 flex-row flex-wrap justify-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="rounded-md"
            style={{ width: 90, minWidth: 90, height: 35 }}
            onPress={() => setContent('')}
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
          <View className="mt-2.5 flex-row flex-wrap justify-center gap-1.5">
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
            >
              <DotIcon className="text-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="bg-card rounded-md"
              style={{ width: 90, minWidth: 90, height: 35 }}
              onPress={() => changeText({ id: ' ' })}
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
            >
              <KeyReturnIcon weight="light" className="text-foreground" />
            </Button>
          </View>
        </View>
      </View>
    </View>
  )
}
