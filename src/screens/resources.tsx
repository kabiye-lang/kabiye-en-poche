import { useCallback } from 'react'
import { ScrollView, TouchableOpacity } from 'react-native'

import * as Application from 'expo-application'
import { Link } from 'expo-router'

import { useLingui } from '@lingui/react/macro'

import { BookOpenTextIcon, CaretRightIcon, UserIcon } from '@/components/icons'
import { Card, ScreenTitle, Text, View } from '@/components/ui'

export default function ResourcesScreen() {
  const { t } = useLingui()
  const listItems = [
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
          // description: t('resources.items.learn.kabyeworkbook.description'),
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
          href: 'https://github.com/kabiye-lang/wiki/wiki',
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
