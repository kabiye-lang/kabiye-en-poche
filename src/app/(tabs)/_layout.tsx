import { useTranslation } from 'react-i18next'

import { Tabs } from 'expo-router'

import { ArticleIcon, BookOpenTextIcon, KeyboardIcon, LightbulbIcon } from '@/components/icons'
import CustomTabBar from '@/components/navigation/tab-bar'
import { tabScreenDefaultOptions } from '@/utils/design-system-nativewind'

export default function TabLayout() {
  const { t } = useTranslation()
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        ...tabScreenDefaultOptions(),
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: t('navigation.home.title'),
          tabBarIcon: ({ color, focused }) => <LightbulbIcon color={color} weight={focused ? 'fill' : 'light'} />,
          href: '/',
          // headerRight: () => (
          //   <Link href="/modal" asChild>
          //     <Pressable>
          //       {({ pressed }) => (
          //         <FontAwesome
          //           name="info-circle"
          //           size={25}
          //           color={Colors[colorScheme ?? 'light'].text}
          //           style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
          //         />
          //       )}
          //     </Pressable>
          //   </Link>
          // ),
        }}
      />
      <Tabs.Screen
        name="dictionnary"
        options={{
          href: '/dictionnary',
          title: t('navigation.dictionary.title'),
          tabBarIcon: ({ color, focused }) => <BookOpenTextIcon color={color} weight={focused ? 'fill' : 'light'} />,
        }}
      />
      <Tabs.Screen
        name="keyboard"
        options={{
          title: t('navigation.keyboard.title'),
          tabBarIcon: ({ color, focused }) => <KeyboardIcon color={color} weight={focused ? 'fill' : 'light'} />,
        }}
      />
      <Tabs.Screen
        name="resources"
        options={{
          title: t('navigation.resources.title'),
          tabBarIcon: ({ color, focused }) => <ArticleIcon color={color} weight={focused ? 'fill' : 'light'} />,
        }}
      />
    </Tabs>
  )
}
