import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, TouchableOpacity } from 'react-native'

import * as Application from 'expo-application'
import { Link } from 'expo-router'

import { BookOpenTextIcon, CaretRightIcon, UserIcon } from '@/components/icons'
import { Card, ScreenTitle, Text, View } from '@/components/ui'

export default function ResourcesScreen() {
  const { t } = useTranslation()
  const listItems = [
    {
      title: t('resources.items.learn.title'),
      items: [
        {
          href: 'https://academiekabiye.org/',
          title: t('resources.items.learn.academiekabiye.title'),
          description: t('resources.items.learn.academiekabiye.description'),
          icon: <BookOpenTextIcon weight="thin" />,
        },
        {
          href: 'https://www.kabiyesekuliye.net/fr',
          title: t('resources.items.learn.kabiyeessekuliye.title'),
          description: t('resources.items.learn.kabiyeessekuliye.description'),
          icon: <BookOpenTextIcon weight="thin" />,
        },
        {
          href: 'http://kabyetanaou.over-blog.com/',
          title: t('resources.items.learn.kabyetanaou.title'),
          description: t('resources.items.learn.kabyetanaou.description'),
          icon: <BookOpenTextIcon weight="thin" />,
        },
        {
          href: 'https://www.livelingua.com/peace-corps/Kabiye/kabiye2010.pdf',
          title: t('resources.items.learn.kabyeworkbook.title'),
          // description: t('resources.items.learn.kabyeworkbook.description'),
          icon: <BookOpenTextIcon weight="thin" />,
        },
        {
          href: 'https://www.lexilogos.com/kabiye_dictionnaire.htm',
          title: t('resources.items.learn.lexilogos.title'),
          description: t('resources.items.learn.lexilogos.description'),
          icon: <BookOpenTextIcon weight="thin" />,
        },
      ],
    },
    {
      title: t('resources.items.support.title'),
      items: [
        {
          href: 'https://github.com/kabiye-lang/wiki/wiki',
          title: t('resources.items.support.join.title'),
          description: t('resources.items.support.join.description'),
          icon: <UserIcon weight="thin" />,
          external: true,
        },
        {
          href: '/terms-and-conditions',
          title: t('resources.items.support.terms_and_conditions.title'),
          description: '',
          icon: <BookOpenTextIcon weight="thin" />,
          // external: true,
        },
      ],
    },
  ]
  const renderListItem = useCallback(
    (item: (typeof listItems)[0]['items'][0]) => (
      <Card key={'listItemSub-' + item.href} variant="elevated" className="mb-2.5 h-[60px] flex-row items-center p-4">
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
          <CaretRightIcon weight="thin" size={22} />
        </View>
      </Card>
    ),
    []
  )

  return (
    <View flex>
      <ScrollView showsVerticalScrollIndicator={false} className="px-4">
        <ScreenTitle title="" />

        {listItems.map((listItem) => {
          return (
            <View key={'listItem-' + listItem.title} className="mb-10">
              <Text variant="h4" weight="semibold" className="mb-2.5">
                {listItem.title}
              </Text>
              {listItem.items.map((item) => {
                return (
                  // @ts-expect-error link string
                  <Link asChild href={item.href} key={item.href}>
                    <TouchableOpacity>{renderListItem(item)}</TouchableOpacity>
                  </Link>
                )
              })}
            </View>
          )
        })}
        <View className="mb-8">
          <Text variant="body" color="grey">
            Version {Application.nativeApplicationVersion} ({Application.nativeBuildVersion})
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}
