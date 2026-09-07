import type { LearnerPath } from '../../hooks/use-path'

import { useState } from 'react'
import { Pressable, ScrollView } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'

import { router } from 'expo-router'

import { useLingui } from '@lingui/react/macro'
import AsyncStorage from '@react-native-async-storage/async-storage'

import { CheckCircleIcon } from '../../components/icons'
import { Button, Text, View } from '../../components/ui'
import { usePath } from '../../hooks/use-path'

const ONBOARDING_KEY = '@kabiye_onboarding_complete'

/**
 * One question, asked once.
 *
 * This replaces three emoji pages that said what the app does and learned nothing. The
 * app serves three audiences who want different things from the same screens -- someone
 * who speaks Kabiyè and cannot write it, someone who grew up hearing it, someone meeting
 * it new -- and the cheapest way to serve all three is to ask which one is reading.
 *
 * The answer only reorders units. It is stored on the device, sent nowhere, and can be
 * changed from Learn, so getting it wrong costs a tap rather than a wrong curriculum.
 */
const OnboardingScreen = () => {
  const { t } = useLingui()
  const { path: stored, setPath } = usePath()
  const [selected, setSelected] = useState<LearnerPath | null>(stored)

  const options: { id: LearnerPath; title: string; sub: string }[] = [
    {
      id: 'speaker',
      title: t`I speak it. I want to write it.`,
      sub: t`Start with the alphabet and spelling.`,
    },
    {
      id: 'heritage',
      title: t`I grew up hearing it.`,
      sub: t`Start with the words you half-remember.`,
    },
    {
      id: 'new',
      title: t`I'm new to it.`,
      sub: t`Start with greetings.`,
    },
  ]

  const finish = async (choice: LearnerPath | null) => {
    if (choice) await setPath(choice)
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true')
    router.replace('/(tabs)/(home)')
  }

  return (
    <View className="bg-surface-ink flex-1">
      {/* A 380px laterite Ɛ bleeding off the top-left, behind everything. The screen is
          otherwise a form, and the letterform is what says which language this is. */}
      <View className="absolute -left-16 -top-24 opacity-[0.35]" pointerEvents="none">
        <Text kabiye weight="bold" className="text-accent text-[380px] leading-[0.8]">
          Ɛ
        </Text>
      </View>

      <ScrollView contentContainerClassName="px-6 pb-8 pt-16" showsVerticalScrollIndicator={false}>
        <View className="flex-row justify-end">
          <Pressable accessibilityRole="button" onPress={() => finish(null)}>
            <Text className="text-on-surface-ink/70 text-[15px]">{t`Skip`}</Text>
          </Pressable>
        </View>

        <Animated.View entering={FadeInDown.duration(600)} className="mt-10">
          <Text className="text-accent text-[13px] font-semibold uppercase tracking-[0.1em]">{t`Before we start`}</Text>
          <Text className="text-on-surface-ink mt-3 text-[32px] leading-[1.1]">
            {t`Where does Kabiyè sit in your life?`}
          </Text>
        </Animated.View>

        <View className="mt-9 gap-3">
          {options.map((option) => {
            const isSelected = selected === option.id
            return (
              <Pressable
                key={option.id}
                accessibilityRole="radio"
                accessibilityLabel={`${option.title} ${option.sub}`}
                accessibilityState={{ selected: isSelected }}
                onPress={() => setSelected(option.id)}
                className={
                  isSelected
                    ? 'bg-on-surface-ink flex-row items-start gap-3 rounded-[14px] px-[18px] py-4'
                    : 'flex-row items-start gap-3 rounded-[14px] border-[1.5px] border-[rgba(244,235,221,0.35)] px-[18px] py-4'
                }
              >
                <View className="flex-1">
                  <Text className={isSelected ? 'text-surface-ink text-[18px]' : 'text-on-surface-ink text-[18px]'}>
                    {option.title}
                  </Text>
                  <Text
                    className={
                      isSelected ? 'text-surface-ink/70 mt-1 text-[14px]' : 'text-on-surface-ink/70 mt-1 text-[14px]'
                    }
                  >
                    {option.sub}
                  </Text>
                </View>
                {isSelected ? <CheckCircleIcon size={22} weight="fill" color="#C4451C" /> : null}
              </Pressable>
            )
          })}
        </View>
      </ScrollView>

      <View className="px-6 pb-10">
        <Button
          variant="primary"
          fullWidth
          disabled={selected === null}
          className="bg-accent"
          onPress={() => finish(selected)}
        >
          {t`Continue`}
        </Button>
      </View>
    </View>
  )
}

export default OnboardingScreen
