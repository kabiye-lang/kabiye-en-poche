import { Tabs } from 'expo-router'

import { useLingui } from '@lingui/react/macro'

import { ArticleIcon, BookOpenTextIcon, KeyboardIcon, LightbulbIcon, UserIcon } from '../../components/icons'
import CustomTabBar from '../../components/navigation/tab-bar'
import { tabScreenDefaultOptions } from '../../utils/design-system-nativewind'

export default function TabLayout() {
  const { t } = useLingui()
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
          title: t`Home`,
          tabBarIcon: ({ color, focused }) => (
            <LightbulbIcon color={color as string} weight={focused ? 'fill' : 'regular'} />
          ),
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
        name="learn"
        options={{
          title: t`Learn`,
          tabBarIcon: ({ color, focused }) => (
            <BookOpenTextIcon color={color as string} weight={focused ? 'fill' : 'regular'} />
          ),
        }}
      />
      <Tabs.Screen
        name="dictionary"
        options={{
          href: '/dictionary',
          title: t`Dictionary`,
          tabBarIcon: ({ color, focused }) => (
            <ArticleIcon color={color as string} weight={focused ? 'fill' : 'regular'} />
          ),
        }}
      />
      <Tabs.Screen
        name="keyboard"
        options={{
          title: t`Keyboard`,
          tabBarIcon: ({ color, focused }) => (
            <KeyboardIcon color={color as string} weight={focused ? 'fill' : 'regular'} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t`Profile`,
          tabBarIcon: ({ color, focused }) => (
            <UserIcon color={color as string} weight={focused ? 'fill' : 'regular'} />
          ),
        }}
      />
    </Tabs>
  )
}
