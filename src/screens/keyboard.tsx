import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dimensions, TextInput } from 'react-native'

import * as Clipboard from 'expo-clipboard'

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
  const { t } = useTranslation()
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
        className="rounded-md bg-white"
        style={{ width: buttonWidth, minWidth: buttonWidth, height: 35 }}
        onPress={() => changeText(letter)}
      >
        <Text variant="lg" weight="regular" className="font-fig-light text-base">
          {capsLock > 0 ? letter.caps : letter.id}
        </Text>
      </Button>
    )
  }

  return (
    <View flex>
      <View className="px-2.5">
        <ScreenTitle title={t('keyboard.title')} />
        {/* TODO: translation */}
        <Text variant="body" className="mb-2">
          {t('keyboard.description.line1')}
        </Text>
        <Text variant="body" className="mb-2">
          {t('keyboard.description.line2_1')} <ArrowFatLineUpIcon weight="regular" size={16} />{' '}
          {t('keyboard.description.line2_2')}
        </Text>
      </View>
      <View flex className="justify-end">
        <View className="px-2.5">
          <TextInput
            value={content}
            multiline
            className="max-h-[120px] min-h-[120px] w-full rounded-lg border border-primary p-2.5 text-base"
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
            <Text variant="body" weight="medium" color="primary">
              {t('keyboard.clear')}
            </Text>
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="rounded-md"
            style={{ width: 90, minWidth: 90, height: 35 }}
            onPress={async () => await Clipboard.setStringAsync(content)}
          >
            <Text variant="body" weight="medium" color="white">
              {t('keyboard.copy')}
            </Text>
          </Button>
        </View>

        {/* <KeyboardAccessoryView
          renderContent={() => (
            <> */}
        <View className="bg-gray-300 p-1.5 pb-5">
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
              className="rounded-md bg-white"
              style={{ width: 50, minWidth: 50, height: 35 }}
              onPress={() => setCapsLock((capsLockOld) => (capsLockOld > 0 ? 0 : 1))}
              onLongPress={() => setCapsLock((capsLockOld) => (capsLockOld > 0 ? 0 : 2))}
            >
              {capsLock === 2 ? (
                <ArrowFatLinesUpIcon weight="fill" />
              ) : (
                <ArrowFatLineUpIcon weight={capsLock === 1 ? 'fill' : 'light'} />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-md bg-white"
              style={{ width: 50, minWidth: 50, height: 35 }}
              onPress={() => changeText({ id: '.' })}
            >
              <DotIcon />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-md bg-white"
              style={{ width: 90, minWidth: 90, height: 35 }}
              onPress={() => changeText({ id: ' ' })}
            >
              <Text variant="body" weight="medium">
                {t('keyboard.space')}
              </Text>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-md bg-white"
              style={{ width: 50, minWidth: 50, height: 35 }}
              onPress={() => setContent((content) => content.substring(0, content.length - 1))}
            >
              <BackspaceIcon weight="light" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-md bg-white"
              style={{ width: 50, minWidth: 50, height: 35 }}
              onPress={() => {
                changeText({ id: '\n' })
                setCapsLock(1)
              }}
            >
              <KeyReturnIcon weight="light" />
            </Button>
          </View>
        </View>
        {/* </>
          )}
          //  kbInputRef={this.inputRef}
          //  kbComponent={}
          //  kbInitialProps={}
          //  onHeightChanged={this.onHeightChanged()}
          // scrollBehavior={KeyboardAccessoryView.scrollBehaviors.NONE}
        /> */}
      </View>
    </View>
  )
}
