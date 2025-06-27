import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dimensions } from 'react-native'
import { Colors, TextField } from 'react-native-ui-lib'

// import { KeyboardAccessoryView } from 'react-native-ui-lib/keyboard'

import * as Clipboard from 'expo-clipboard'

import { ArrowFatLinesUpIcon, ArrowFatLineUpIcon, BackspaceIcon, DotIcon, KeyReturnIcon } from '@/components/icons'
import { ScreenTitle } from '@/components/screen-title'
import { Button, Text, View } from '@/components/themed'
import alphabetList from '@/utils/data/alphabet.json'
import { fonts } from '@/utils/design-system'

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
        title={letter.id}
        label={capsLock > 0 ? letter.caps : letter.id}
        marginV-0
        marginH-0
        paddingH-0
        paddingT-0
        paddingB-0
        style={{ width: buttonWidth, minWidth: buttonWidth, height: 35 }}
        labelStyle={{ fontFamily: fonts.fig3, fontSize: 20, color: Colors.$textDefault }}
        borderRadius={5}
        backgroundColor={Colors.white}
        onPress={() => changeText(letter)}
      />
    )
  }

  return (
    <View flex>
      <View paddingH-10>
        <ScreenTitle title={t('keyboard.title')} />
        {/* TODO: translation */}
        <Text>{t('keyboard.description.line1')}</Text>
        <Text>
          {t('keyboard.description.line2_1')} <ArrowFatLineUpIcon weight="regular" size={16} />{' '}
          {t('keyboard.description.line2_2')}
        </Text>
      </View>
      <View flex style={{ justifyContent: 'flex-end' }}>
        <View paddingH-10>
          <TextField
            value={content}
            multiline
            fieldStyle={{
              borderWidth: 1,
              width: '100%',
              borderRadius: 10,
              borderColor: Colors.primary,
              minHeight: 120,
              maxHeight: 120,
              padding: 10,
            }}
          />
        </View>
        <View style={{ flexWrap: 'wrap', gap: 5 }} row centerH marginB-10 marginT-20>
          <Button
            title="clear"
            label={t('keyboard.clear')}
            marginV-0
            marginH-0
            paddingH-0
            paddingT-0
            paddingB-0
            outline
            style={{ width: 90, minWidth: 90, height: 35, borderColor: Colors.primary }}
            labelStyle={{ color: Colors.primary }}
            borderRadius={5}
            onPress={() => setContent('')}
          />
          <Button
            title="copy"
            label={t('keyboard.copy')}
            marginV-0
            marginH-0
            paddingH-0
            paddingT-0
            paddingB-0
            // outline
            style={{ width: 90, minWidth: 90, height: 35, borderColor: Colors.primary }}
            // labelStyle={{ color: Colors.primary }}
            // backgroundColor={Colors.secondary}
            borderRadius={5}
            onPress={async () => await Clipboard.setStringAsync(content)}
          />
        </View>

        {/* <KeyboardAccessoryView
          renderContent={() => (
            <> */}
        <View padding-5 paddingB-20 bg-grey60>
          <View style={{ flexWrap: 'wrap', gap: 5, justifyContent: 'center' }} row marginT-10>
            {OTHER_CHARACTERS.concat(alphabetList)
              // @ts-expect-error hideInKeyboard doesn't exist on tpe
              .filter((letter) => !letter.hideInKeyboard)
              .map((letter) => renderButton(letter))}
          </View>
          <View style={{ flexWrap: 'wrap', gap: 5 }} row centerH marginT-10>
            <Button
              title="cap lock"
              label=""
              marginV-0
              marginH-0
              paddingH-0
              paddingT-0
              paddingB-0
              style={{ width: 50, minWidth: 50, height: 35 }}
              labelStyle={{ color: Colors.$textDefault }}
              backgroundColor={Colors.white}
              borderRadius={5}
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
              title="dot"
              label=""
              marginV-0
              marginH-0
              paddingH-0
              paddingT-0
              paddingB-0
              style={{ width: 50, minWidth: 50, height: 35 }}
              borderRadius={5}
              labelStyle={{ color: Colors.$textDefault }}
              backgroundColor={Colors.white}
              onPress={() => changeText({ id: '.' })}
            >
              <DotIcon />
            </Button>
            <Button
              title="space"
              label={t('keyboard.space')}
              marginV-0
              marginH-0
              paddingH-0
              paddingT-0
              paddingB-0
              style={{ width: 90, minWidth: 90, height: 35 }}
              borderRadius={5}
              labelStyle={{ color: Colors.$textDefault }}
              backgroundColor={Colors.white}
              onPress={() => changeText({ id: ' ' })}
            />
            <Button
              title="BackspaceIcon"
              label=""
              marginV-0
              marginH-0
              paddingH-0
              paddingT-0
              paddingB-0
              style={{ width: 50, minWidth: 50, height: 35 }}
              borderRadius={5}
              labelStyle={{ color: Colors.$textDefault }}
              backgroundColor={Colors.white}
              onPress={() => setContent((content) => content.substring(0, content.length - 1))}
            >
              <BackspaceIcon weight="light" />
            </Button>
            <Button
              title="enter"
              label=""
              marginV-0
              marginH-0
              paddingH-0
              paddingT-0
              paddingB-0
              style={{ width: 50, minWidth: 50, height: 35 }}
              borderRadius={5}
              labelStyle={{ color: Colors.$textDefault }}
              backgroundColor={Colors.white}
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
