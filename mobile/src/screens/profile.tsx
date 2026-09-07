import { Alert, Linking, Platform, Pressable, ScrollView } from 'react-native'

import * as Application from 'expo-application'
import { Href, useRouter } from 'expo-router'

import { useLingui } from '@lingui/react/macro'
import { toast } from 'sonner-native'

import { ArrowUpRightIcon, CaretRightIcon } from '../components/icons'
import { Text, View } from '../components/ui'
import { useAppProgressSummary, useAppResetProgress } from '../hooks/use-app-data'
import { nextAppearance, useAppearance } from '../hooks/use-appearance'
import { useMyWords } from '../hooks/use-my-words'
import { usePath } from '../hooks/use-path'

/** Lessons planned in the curriculum. 78 plans exist; only some have content. */
const PLANNED_LESSONS = 78

const ProfileScreen = () => {
  const { t, i18n } = useLingui()
  const router = useRouter()
  const { data: progressSummary } = useAppProgressSummary()
  const myWords = useMyWords()
  const resetProgressMutation = useAppResetProgress()
  const { appearance, setAppearance } = useAppearance()
  const { path } = usePath()

  // Resources data from the original resources screen
  const listItems: {
    title: string
    items: {
      href: string
      title: string
      description?: string
      external?: boolean
    }[]
  }[] = [
    {
      title: t`Learning Resources`,
      items: [
        {
          href: 'https://academiekabiye.org/',
          title: t`Académie Kabiyè`,
          description: t`Official Kabiyè Academy website`,
        },
        {
          href: 'https://www.kabiyesekuliye.net/fr',
          title: t`Kabiyè Essékuliye`,
          description: t`Kabiyè language learning platform`,
        },
        {
          href: 'http://kabyetanaou.over-blog.com/',
          title: t`Kabiyè Tanaou`,
          description: t`Kabiyè language resources`,
        },
        {
          href: 'https://www.livelingua.com/peace-corps/Kabiye/kabiye2010.pdf',
          title: t`Kabiyè Workbook`,
        },
        {
          href: 'https://www.lexilogos.com/kabiye_dictionnaire.htm',
          title: t`Lexilogos Dictionary`,
          description: t`Online Kabiyè dictionary`,
        },
      ],
    },
    {
      title: t`Support`,
      items: [
        {
          href: 'https://github.com/kabiye-lang/kabiye-en-poche/wiki',
          title: t`Join the community`,
          description: t`Join our community to contribute to the development of the application`,
          external: true,
        },
        {
          href: '/terms-and-conditions',
          title: t`Terms and conditions of use`,
          description: '',
        },
        {
          href: '/privacy-policy',
          title: t`Privacy Policy`,
          description: t`How we collect and use your data`,
        },
      ],
    },
  ]

  const handleResourcePress = async (href: string, external?: boolean) => {
    if (external) {
      await Linking.openURL(href)
    }
  }

  const openLanguageSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:')
    } else {
      Linking.openSettings()
    }
  }

  const handleResetProgress = () => {
    Alert.alert(t`Reset Progress`, t`Are you sure you want to reset all your progress? This action cannot be undone.`, [
      {
        text: t`Cancel`,
        style: 'cancel',
      },
      {
        text: t`Reset`,
        style: 'destructive',
        onPress: async () => {
          try {
            await resetProgressMutation.mutateAsync()
            toast.success(t`Success`, {
              description: t`Your progress has been reset successfully.`,
            })
          } catch (error) {
            toast.error(t`Error`, {
              description: t`Failed to reset progress. Please try again.`,
            })
            console.error('Error resetting progress:', error)
          }
        },
      },
    ])
  }

  return (
    <View flex safeArea="top" className="bg-background">
      <ScrollView contentContainerClassName="px-6 pb-8 pt-2" showsVerticalScrollIndicator={false}>
        <Text weight="semibold" className="text-foreground mb-7 mt-2 text-[40px] leading-[1.0]">
          {t`Your Kabiyè`}
        </Text>

        {/* Two counts, not a percentage.
            A percentage of the curriculum is a number about us -- 7 of 78 lessons are
            written -- and showing a learner 9% after they worked through a lesson is
            both discouraging and about the wrong thing. Words met and words spelled are
            about them, and both are true. */}
        <View className="mb-6 flex-row gap-3">
          <View className="bg-foreground flex-1 rounded-[14px] p-4">
            <Text weight="semibold" className="text-background text-[48px] leading-[1.0]">
              {myWords.readCount}
            </Text>
            <Text className="text-background/70 mt-2 text-[14px] leading-[1.3]">{t`words you can read`}</Text>
          </View>
          <View className="border-foreground flex-1 rounded-[14px] border-[1.5px] p-4">
            <Text weight="semibold" className="text-foreground text-[48px] leading-[1.0]">
              {myWords.writtenCount}
            </Text>
            <Text className="text-foreground-secondary mt-2 text-[14px] leading-[1.3]">{t`words you can write`}</Text>
          </View>
        </View>

        {/* Lessons, stated rather than scored -- including how much is not written yet,
            which the learner is entitled to know before they plan around it. */}
        {progressSummary ? (
          <View className="border-foreground mb-8 rounded-[14px] border-[1.5px] p-4">
            <Text className="text-foreground text-[17px]">
              {t`${progressSummary.completedLessons} of ${progressSummary.totalLessons} lessons`}
              {PLANNED_LESSONS > progressSummary.totalLessons
                ? ` · ${t`${PLANNED_LESSONS - progressSummary.totalLessons} more planned`}`
                : ''}
            </Text>
            <View className="mt-3 flex-row gap-[3px]">
              {Array.from({ length: Math.max(progressSummary.totalLessons, 1) }, (_, i) => (
                <View
                  key={i}
                  className={
                    i < progressSummary.completedLessons
                      ? 'bg-foreground h-7 w-[10px] rounded-sm'
                      : 'bg-border h-7 w-[10px] rounded-sm'
                  }
                />
              ))}
            </View>
          </View>
        ) : null}

        {/* Settings, then resources: laterite label, a 1.5px rule, hairline rows with the
            current value on the right. No cards -- depth here is the rule, not a box. */}
        <Section label={t`Settings`}>
          <Row
            label={t`Interface language`}
            value={i18n.locale === 'fr' ? 'Français' : 'English'}
            onPress={openLanguageSettings}
          />
          <Row
            label={t`My path`}
            value={
              path === 'speaker'
                ? t`I speak it`
                : path === 'heritage'
                  ? t`I grew up hearing it`
                  : path === 'new'
                    ? t`I'm new to it`
                    : t`Not set`
            }
            onPress={() => router.push('/(onboarding)')}
          />
          {/* One row cycling System → Light → Dark. Three rows or a modal for a setting
              with three values is more chrome than the setting is worth. */}
          <Row
            label={t`Appearance`}
            value={appearance === 'light' ? t`Light` : appearance === 'dark' ? t`Dark` : t`System`}
            onPress={() => void setAppearance(nextAppearance(appearance))}
            last
          />
        </Section>

        {listItems.map((listItem) => (
          <Section key={listItem.title} label={listItem.title}>
            {listItem.items.map((item, index) => (
              <Row
                key={item.href}
                label={item.title}
                value={item.description}
                external={item.external || item.href.startsWith('http')}
                last={index === listItem.items.length - 1}
                onPress={() => {
                  if (item.href.startsWith('http')) {
                    void handleResourcePress(item.href, true)
                  } else {
                    router.push(item.href as Href)
                  }
                }}
              />
            ))}
          </Section>
        ))}

        {/* The footer the direction asks for: the destructive action stated quietly, and
            the version beside the two documents nobody reads until they need to. */}
        <View className="border-border mt-4 flex-row items-center justify-between border-t pt-6">
          <Pressable accessibilityRole="button" onPress={handleResetProgress}>
            <Text className="text-foreground-secondary text-[14px] underline">{t`Reset progress`}</Text>
          </Pressable>
          <View className="flex-row items-center gap-2">
            <Pressable accessibilityRole="link" onPress={() => router.push('/privacy-policy')}>
              <Text className="text-foreground-secondary text-[14px]">{t`Privacy`}</Text>
            </Pressable>
            <Text className="text-foreground-secondary text-[14px]">·</Text>
            <Pressable accessibilityRole="link" onPress={() => router.push('/terms-and-conditions')}>
              <Text className="text-foreground-secondary text-[14px]">{t`Terms`}</Text>
            </Pressable>
            <Text className="text-foreground-secondary text-[14px]">· v{Application.nativeApplicationVersion}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

/** A titled group: laterite label, 1.5px rule, then rows. */
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="mb-8">
      <Text className="text-accent text-[13px] font-semibold uppercase tracking-[0.1em]">{label}</Text>
      <View className="border-foreground mt-3 border-t-[1.5px]" />
      {children}
    </View>
  )
}

/** One row: label, the current value at the right, and a caret or an outward arrow. */
function Row({
  label,
  value,
  onPress,
  external,
  last,
}: {
  label: string
  value?: string
  onPress: () => void
  external?: boolean
  last?: boolean
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={last ? 'flex-row items-center py-3.5' : 'border-border flex-row items-center border-b py-3.5'}
    >
      <Text className="text-foreground flex-1 text-[17px]">{label}</Text>
      {value ? (
        <Text className="text-foreground-secondary mr-2 max-w-[45%] text-right text-[15px]" numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {external ? (
        <ArrowUpRightIcon size={16} className="text-foreground-secondary" />
      ) : (
        <CaretRightIcon size={16} weight="bold" className="text-foreground-secondary" />
      )}
    </Pressable>
  )
}

export default ProfileScreen
