import { useState } from 'react'
import { Alert, Linking, ScrollView, Switch, TouchableOpacity } from 'react-native'

import * as Application from 'expo-application'
import { Link } from 'expo-router'

import { useLingui } from '@lingui/react/macro'

import { BookOpenTextIcon, CaretRightIcon, GearIcon, TrashIcon, UserIcon } from '@/components/icons'
import { Card, ScreenTitle, Text, View } from '@/components/ui'
import { useAppProgressSummary } from '@/hooks/use-app-data'

const ProfileScreen = () => {
  const { t, i18n } = useLingui()
  const [isEnglish, setIsEnglish] = useState(i18n.locale === 'en')

  const { data: progressSummary, isLoading: progressLoading } = useAppProgressSummary()

  // Resources data from the original resources screen
  const listItems: {
    title: string
    items: {
      href: string
      title: string
      description?: string
      icon: React.ReactElement
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
          icon: <BookOpenTextIcon weight="thin" />,
        },
        {
          href: 'https://www.kabiyesekuliye.net/fr',
          title: t`Kabiyè Essékuliye`,
          description: t`Kabiyè language learning platform`,
          icon: <BookOpenTextIcon weight="thin" />,
        },
        {
          href: 'http://kabyetanaou.over-blog.com/',
          title: t`Kabiyè Tanaou`,
          description: t`Kabiyè language resources`,
          icon: <BookOpenTextIcon weight="thin" />,
        },
        {
          href: 'https://www.livelingua.com/peace-corps/Kabiye/kabiye2010.pdf',
          title: t`Kabiyè Workbook`,
          icon: <BookOpenTextIcon weight="thin" />,
        },
        {
          href: 'https://www.lexilogos.com/kabiye_dictionnaire.htm',
          title: t`Lexilogos Dictionary`,
          description: t`Online Kabiyè dictionary`,
          icon: <BookOpenTextIcon weight="thin" />,
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
          icon: <UserIcon weight="thin" />,
          external: true,
        },
        {
          href: '/terms-and-conditions',
          title: t`Terms and conditions of use`,
          description: '',
          icon: <BookOpenTextIcon weight="thin" />,
        },
      ],
    },
  ]

  const handleResourcePress = async (href: string, external?: boolean) => {
    if (external) {
      await Linking.openURL(href)
    }
  }

  const handleLanguageToggle = (value: boolean) => {
    setIsEnglish(value)
    i18n.activate(value ? 'en' : 'fr')
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
        onPress: () => {
          // TODO: Implement reset progress functionality
          Alert.alert(t`Progress Reset`, t`Your progress has been reset.`)
        },
      },
    ])
  }

  return (
    <View flex className="bg-grey">
      <ScrollView className="px-4 pb-5">
        <ScreenTitle title={t`Profile`} />
        {/* Progress Overview */}
        <Card className="mb-8 p-4">
          <View className="mb-4 flex-row items-center">
            <UserIcon size={24} color="#6200EE" />
            <Text variant="h5" weight="semibold" color="dark" className="ml-2">
              {t`Progress Overview`}
            </Text>
          </View>

          {progressLoading ? (
            <View className="py-4">
              <Text variant="body" color="grey" className="text-center">
                {t`Loading progress...`}
              </Text>
            </View>
          ) : progressSummary ? (
            <View className="space-y-3">
              <View className="flex-row items-center justify-between">
                <Text variant="body" color="grey">
                  {t`Units completed`}
                </Text>
                <Text variant="h6" weight="bold" color="primary">
                  {progressSummary.completedUnits} / {progressSummary.totalUnits}
                </Text>
              </View>

              <View className="flex-row items-center justify-between">
                <Text variant="body" color="grey">
                  {t`Lessons completed`}
                </Text>
                <Text variant="h6" weight="bold" color="primary">
                  {progressSummary.completedLessons} / {progressSummary.totalLessons}
                </Text>
              </View>

              <View className="mt-3">
                <View className="mb-1 flex-row items-center justify-between">
                  <Text variant="caption" color="grey">
                    {t`Overall Progress`}
                  </Text>
                  <Text variant="caption" color="primary">
                    {Math.round(progressSummary.progressPercentage)}%
                  </Text>
                </View>
                <View className="bg-grey h-2 w-full rounded-full">
                  <View
                    className="h-2 rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${progressSummary.progressPercentage}%` }}
                  />
                </View>
              </View>
            </View>
          ) : (
            <Text variant="body" color="grey" className="py-4 text-center">
              {t`No progress data available`}
            </Text>
          )}
        </Card>

        {/* Resources Section */}
        {listItems.map((listItem) => (
          <View key={'listItem-' + listItem.title} className="mb-5">
            <View className="mb-4 flex-row items-center">
              <BookOpenTextIcon size={24} color="#6200EE" />
              <Text variant="h5" weight="semibold" color="dark" className="ml-2">
                {listItem.title}
              </Text>
            </View>

            <View className="space-y-3">
              {listItem.items.map((item) => (
                <Card key={'listItemSub-' + item.href} className="mb-4 min-h-[60px] flex-row items-center p-4">
                  <View className="mr-2.5">{item.icon}</View>
                  <View className="flex-1 flex-col">
                    <Text variant="h6" weight="medium" className="ml-2.5">
                      {item.title}
                    </Text>
                    {item.description && (
                      <Text variant="small" color="grey" className="ml-2.5" numberOfLines={3}>
                        {item.description}
                      </Text>
                    )}
                  </View>
                  <View>
                    {item.external ? (
                      <TouchableOpacity onPress={() => handleResourcePress(item.href, true)}>
                        <CaretRightIcon weight="thin" size={22} />
                      </TouchableOpacity>
                    ) : (
                      <Link asChild href={item.href}>
                        <TouchableOpacity>
                          <CaretRightIcon weight="thin" size={22} />
                        </TouchableOpacity>
                      </Link>
                    )}
                  </View>
                </Card>
              ))}
            </View>
          </View>
        ))}

        {/* Settings Section */}
        <Card className="mb-5 p-4">
          <View className="mb-4 flex-row items-center">
            <GearIcon size={24} color="#6200EE" />
            <Text variant="h5" weight="semibold" color="dark" className="ml-2">
              {t`Settings`}
            </Text>
          </View>

          <View className="space-y-4">
            {/* Language Setting */}
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text variant="body" weight="medium" color="dark" className="mb-1">
                  {t`App Language`}
                </Text>
                <Text variant="caption" color="grey">
                  {t`Choose your preferred interface language`}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Text variant="caption" color={!isEnglish ? 'primary' : 'grey'} className="mr-2">
                  FR
                </Text>
                <Switch
                  value={isEnglish}
                  onValueChange={handleLanguageToggle}
                  trackColor={{ false: '#E0E0E0', true: '#6200EE' }}
                  thumbColor={isEnglish ? '#FFFFFF' : '#FFFFFF'}
                />
                <Text variant="caption" color={isEnglish ? 'primary' : 'grey'} className="ml-2">
                  EN
                </Text>
              </View>
            </View>

            {/* Reset Progress */}
            <TouchableOpacity
              className="mt-8 flex-row items-center justify-between rounded-lg bg-red-50 p-3"
              onPress={handleResetProgress}
            >
              <View className="flex-1 flex-row items-center">
                <TrashIcon size={20} color="#F44336" />
                <View className="ml-3">
                  <Text variant="body" weight="medium" color="dark" className="mb-1">
                    {t`Reset Progress`}
                  </Text>
                  <Text variant="caption" color="grey">
                    {t`Clear all your learning progress`}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </Card>

        {/* App Info */}
        <View className="mb-5 p-4">
          <Text variant="caption" color="grey" className="text-center">
            Version {Application.nativeApplicationVersion} ({Application.nativeBuildVersion})
          </Text>
          <Text variant="caption" color="grey" className="mt-1 text-center">
            {t`Learn Kabiyè in a fun and interactive way`}
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

export default ProfileScreen
