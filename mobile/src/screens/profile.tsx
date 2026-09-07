import { Alert, Linking, Platform, Pressable, ScrollView } from 'react-native'

import * as Application from 'expo-application'
import { Href, useRouter } from 'expo-router'

import { useLingui } from '@lingui/react/macro'
import { toast } from 'sonner-native'

import { BookOpenTextIcon, CaretRightIcon, GearIcon, GlobeIcon, TrashIcon, UserIcon } from '../components/icons'
import { Text, View } from '../components/ui'
import { useAppProgressSummary, useAppResetProgress } from '../hooks/use-app-data'
import { useMyWords } from '../hooks/use-my-words'

/** Lessons planned in the curriculum. 78 plans exist; only some have content. */
const PLANNED_LESSONS = 78

const ProfileScreen = () => {
  const { t, i18n } = useLingui()
  const router = useRouter()
  const { data: progressSummary } = useAppProgressSummary()
  const myWords = useMyWords()
  const resetProgressMutation = useAppResetProgress()

  // Resources data from the original resources screen
  const listItems: {
    title: string
    items: {
      href: string
      title: string
      description?: string
      icon?: React.ReactElement
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
          icon: <UserIcon weight="thin" className="text-foreground" />,
          external: true,
        },
        {
          href: '/terms-and-conditions',
          title: t`Terms and conditions of use`,
          description: '',
          icon: <BookOpenTextIcon weight="thin" className="text-foreground" />,
        },
        {
          href: '/privacy-policy',
          title: t`Privacy Policy`,
          description: t`How we collect and use your data`,
          icon: <BookOpenTextIcon weight="thin" className="text-foreground" />,
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

        {/* Resources Section — simple list rows */}
        {listItems.map((listItem) => (
          <View key={'listItem-' + listItem.title} className="mb-5">
            <View className="mb-2 flex-row items-center">
              <BookOpenTextIcon size={20} className="text-primary" />
              <Text variant="h6" weight="semibold" className="text-foreground ml-2">
                {listItem.title}
              </Text>
            </View>

            <View className="bg-card overflow-hidden rounded-xl">
              {listItem.items.map((item, index) => (
                <Pressable
                  key={'listItemSub-' + item.href}
                  onPress={() => {
                    if (item.external) {
                      handleResourcePress(item.href, true)
                    } else {
                      router.push(item.href as Href)
                    }
                  }}
                  className={`flex-row items-center px-4 py-3 ${
                    index < listItem.items.length - 1 ? 'border-border border-b' : ''
                  }`}
                >
                  {item.icon ? <View className="mr-2.5">{item.icon}</View> : null}
                  <View className="flex-1 flex-col">
                    <Text variant="body" weight="medium" className="text-foreground">
                      {item.title}
                    </Text>
                    {item.description && (
                      <Text variant="caption" className="text-foreground-secondary mt-0.5" numberOfLines={2}>
                        {item.description}
                      </Text>
                    )}
                  </View>
                  <CaretRightIcon weight="regular" size={18} className="text-foreground-secondary" />
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        {/* Settings Section — grouped list */}
        <View className="mb-5">
          <View className="mb-2 flex-row items-center">
            <GearIcon size={20} className="text-primary" />
            <Text variant="h6" weight="semibold" className="text-foreground ml-2">
              {t`Settings`}
            </Text>
          </View>

          <View className="bg-card overflow-hidden rounded-xl">
            {/* Language Setting */}
            <Pressable
              className="border-border flex-row items-center justify-between border-b px-4 py-3"
              onPress={openLanguageSettings}
            >
              <View className="flex-1 flex-row items-center">
                <GlobeIcon size={20} className="text-primary" />
                <View className="ml-3 flex-1">
                  <Text variant="body" weight="medium" className="text-foreground">
                    {t`App Language`}
                  </Text>
                  <Text variant="caption" className="text-foreground-secondary mt-0.5">
                    {i18n.locale === 'en' ? 'English' : 'Français'}
                  </Text>
                </View>
              </View>
              <CaretRightIcon weight="regular" size={18} className="text-foreground-secondary" />
            </Pressable>

            {/* Reset Progress */}
            <Pressable className="flex-row items-center justify-between px-4 py-3" onPress={handleResetProgress}>
              <View className="flex-1 flex-row items-center">
                <TrashIcon size={20} className="text-accent" />
                <View className="ml-3">
                  <Text variant="body" weight="medium" className="text-foreground">
                    {t`Reset Progress`}
                  </Text>
                  <Text variant="caption" className="text-foreground-secondary mt-0.5">
                    {t`Clear all your learning progress`}
                  </Text>
                </View>
              </View>
            </Pressable>
          </View>
        </View>

        {/* App Info */}
        <View className="mb-5 p-4">
          <Text variant="caption" className="text-foreground-secondary text-center">
            Version {Application.nativeApplicationVersion} ({Application.nativeBuildVersion})
          </Text>
          <Text variant="caption" className="text-foreground-secondary mt-1 text-center">
            {t`Learn Kabiyè in a fun and interactive way`}
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

export default ProfileScreen
