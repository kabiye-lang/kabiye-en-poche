import { useState } from 'react'
import { Dimensions, TextInput } from 'react-native'

import * as Clipboard from 'expo-clipboard'

import { useLingui } from '@lingui/react/macro'

import { ArrowFatLinesUpIcon, ArrowFatLineUpIcon, BackspaceIcon, DotIcon, KeyReturnIcon } from '@/components/icons'
import { Button, ScreenTitle, Text, View } from '@/components/ui'
import alphabetList from '@/utils/data/alphabet.json'

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
  const changeText = (letter: Partial<(typeof alphabetList)[0]>) => {
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
        className="rounded-md bg-white !px-0 !py-0 dark:bg-gray-800"
        style={{ width: buttonWidth, minWidth: buttonWidth, height: 35 }}
        onPress={() => changeText(letter)}
      >
        <Text variant="lg" weight="regular" className="font-fig-light text-base text-gray-900 dark:text-gray-100">
          {capsLock > 0 ? letter.caps : letter.id}
        </Text>
      </Button>
    )
  }

  return (
    <View flex className="bg-white dark:bg-gray-900">
      <View className="px-2.5">
        <ScreenTitle title={t`Keyboard`} />
        <Text variant="body" className="mb-2">
          {t`Use this keyboard to write in Kabiyè.`}
        </Text>
        <Text variant="body" className="mb-2">
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
            className="max-h-[120px] min-h-[120px] w-full rounded-lg border border-primary bg-white p-2.5 text-base text-gray-900 dark:border-primary dark:bg-gray-800 dark:text-gray-100"
            placeholder="Type here..."
            placeholderTextColor="#9CA3AF"
          />
        </View>
        <View className="mb-2.5 mt-5 flex-row flex-wrap justify-center gap-1.5">
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
        <View className="bg-gray-200 p-1.5 pb-5 dark:bg-gray-700">
          <View className="mt-2.5 flex-row flex-wrap justify-center gap-1.5">
            {OTHER_CHARACTERS.concat(alphabetList)
              // @ts-expect-error hideInKeyboard doesn't exist on tpe
              .filter((letter) => !letter.hideInKeyboard)
              .map((letter) => renderButton(letter))}
          </View>
          <View className="mt-2.5 flex-row flex-wrap justify-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-md bg-white dark:bg-gray-800"
              style={{ width: 50, minWidth: 50, height: 35 }}
              onPress={() => setCapsLock((capsLockOld) => (capsLockOld > 0 ? 0 : 1))}
              onLongPress={() => setCapsLock((capsLockOld) => (capsLockOld > 0 ? 0 : 2))}
            >
              {capsLock === 2 ? (
                <ArrowFatLinesUpIcon weight="fill" className="text-gray-900 dark:text-gray-100" />
              ) : (
                <ArrowFatLineUpIcon
                  weight={capsLock === 1 ? 'fill' : 'light'}
                  className="text-gray-900 dark:text-gray-100"
                />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-md bg-white dark:bg-gray-800"
              style={{ width: 50, minWidth: 50, height: 35 }}
              onPress={() => changeText({ id: '.' })}
            >
              <DotIcon className="text-gray-900 dark:text-gray-100" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-md bg-white dark:bg-gray-800"
              style={{ width: 90, minWidth: 90, height: 35 }}
              onPress={() => changeText({ id: ' ' })}
            >
              <Text variant="body" weight="medium">
                {t`Space`}
              </Text>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-md bg-white dark:bg-gray-800"
              style={{ width: 50, minWidth: 50, height: 35 }}
              onPress={() => setContent((content) => content.substring(0, content.length - 1))}
            >
              <BackspaceIcon weight="light" className="text-gray-900 dark:text-gray-100" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-md bg-white dark:bg-gray-800"
              style={{ width: 50, minWidth: 50, height: 35 }}
              onPress={() => {
                changeText({ id: '\n' })
                setCapsLock(1)
              }}
            >
              <KeyReturnIcon weight="light" className="text-gray-900 dark:text-gray-100" />
            </Button>
          </View>
        </View>
      </View>
    </View>
  )
}
