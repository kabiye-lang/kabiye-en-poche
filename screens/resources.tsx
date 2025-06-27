import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native'
import { ListItem } from 'react-native-ui-lib'

import * as Application from 'expo-application'
import { Link } from 'expo-router'

import { BookOpenTextIcon, CaretRightIcon, UserIcon } from '@/components/icons'
import { ScreenTitle } from '@/components/screen-title'
import { Text, View } from '@/components/themed'

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
      <ListItem key={'listItemSub-' + item.href} style={{ height: 60 }} marginB-10>
        <ListItem.Part left>{item.icon}</ListItem.Part>
        <ListItem.Part middle column>
          <Text h6 marginL-10>
            {item.title}
          </Text>
          {item.description && (
            <Text sm marginL-10 numberOfLines={3}>
              {item.description}
            </Text>
          )}
        </ListItem.Part>
        <ListItem.Part right>
          <CaretRightIcon weight="thin" size={22} />
        </ListItem.Part>
      </ListItem>
    ),
    []
  )

  return (
    <View flex>
      <ScrollView showsVerticalScrollIndicator={false} style={{ paddingHorizontal: 15 }}>
        <ScreenTitle title="" />

        {listItems.map((listItem) => {
          return (
            <View key={'listItem-' + listItem.title} marginB-40>
              <Text h4 family="fig6" marginB-10>
                {listItem.title}
              </Text>
              {listItem.items.map((item) => {
                return (
                  // @ts-expect-error link string
                  <Link asChild href={item.href} key={item.href}>
                    {renderListItem(item)}
                  </Link>
                )
              })}
            </View>
          )
        })}
        <View marginB-30>
          <Text>
            Version {Application.nativeApplicationVersion} ({Application.nativeBuildVersion})
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}
