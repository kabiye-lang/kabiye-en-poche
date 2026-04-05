import { Alert, Linking, Platform, ScrollView, TouchableOpacity } from 'react-native'

import * as Application from 'expo-application'
import { Href, useRouter } from 'expo-router'

import { useLingui } from '@lingui/react/macro'
import { toast } from 'sonner-native'

import { BookOpenTextIcon, CaretRightIcon, GearIcon, GlobeIcon, TrashIcon, UserIcon } from '@/components/icons'
import { ScreenTitle, Text, View } from '@/components/ui'
import { useAppProgressSummary, useAppResetProgress } from '@/hooks/use-app-data'

const ProfileScreen = () => {
  const { t, i18n } = useLingui()
  const router = useRouter()
  const { data: progressSummary, isLoading: progressLoading } = useAppProgressSummary()
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
    <View flex className="bg-background">
      <ScrollView className="px-4 pb-5">
        <ScreenTitle title={t`Profile`} />
        {/* Progress Overview */}
        <View className="bg-card mb-8 rounded-2xl p-4">
          <View className="mb-4 flex-row items-center">
            <UserIcon size={24} className="text-primary" />
            <Text variant="h5" weight="semibold" className="text-foreground ml-2">
              {t`Progress Overview`}
            </Text>
          </View>

          {progressLoading ? (
            <View className="py-4">
              <View className="bg-background-tertiary h-6 w-full rounded-full" />
            </View>
          ) : progressSummary ? (
            <View className="space-y-3">
              <View className="flex-row items-center justify-between">
                <Text variant="body" className="text-foreground-secondary">
                  {t`Units completed`}
                </Text>
                <Text variant="h6" weight="bold" className="text-primary">
                  {progressSummary.completedUnits} / {progressSummary.totalUnits}
                </Text>
              </View>

              <View className="flex-row items-center justify-between">
                <Text variant="body" className="text-foreground-secondary">
                  {t`Lessons completed`}
                </Text>
                <Text variant="h6" weight="bold" className="text-primary">
                  {progressSummary.completedLessons} / {progressSummary.totalLessons}
                </Text>
              </View>

              <View className="mt-3">
                <View className="bg-progress-track h-6 w-full overflow-hidden rounded-full">
                  <View
                    className="bg-primary h-6 items-center justify-center rounded-full"
                    style={{ width: `${Math.max(progressSummary.progressPercentage, 15)}%` }}
                  >
                    <Text variant="caption" weight="bold" className="text-white">
                      {Math.round(progressSummary.progressPercentage)}%
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <View className="py-4">
              <Text variant="body" className="text-foreground-secondary text-center">
                {t`Your learning journey starts here.`}
              </Text>
              <Text variant="caption" className="text-primary mt-1 text-center">
                0% — {t`Start a lesson to begin tracking`}
              </Text>
            </View>
          )}
        </View>

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
                <TouchableOpacity
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
                </TouchableOpacity>
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
            <TouchableOpacity
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
            </TouchableOpacity>

            {/* Reset Progress */}
            <TouchableOpacity
              className="flex-row items-center justify-between px-4 py-3"
              onPress={handleResetProgress}
            >
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
            </TouchableOpacity>
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
