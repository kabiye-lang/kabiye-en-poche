import { router, Stack } from 'expo-router'

import { useLingui } from '@lingui/react/macro'

import { EmptyState } from '../components/empty-state'
import { View } from '../components/ui'

/**
 * The one screen a learner should never see, in the language and palette of the ones
 * they should.
 *
 * This was still the Expo template: an untranslated "Oops!", a blue link, and a white
 * ground -- the only screen in the app outside both interface languages and the whole
 * three-colour system. It now says what still works, the way every other empty state in
 * the app does.
 */
export default function NotFoundScreen() {
  const { t } = useLingui()

  return (
    <>
      <Stack.Screen options={{ title: '', headerTransparent: true, headerBackButtonDisplayMode: 'minimal' }} />
      <View flex safeArea="top" className="bg-background justify-center px-6">
        <EmptyState
          glyph="ɖ"
          title={t`This page isn't here`}
          body={t`The link may be old, or the word may have moved. The dictionary, your saved words and the alphabet are all still where you left them.`}
          actions={[
            { label: t`Dictionary`, onPress: () => router.replace('/(tabs)/dictionary'), primary: true },
            { label: t`Home`, onPress: () => router.replace('/(tabs)') },
          ]}
        />
      </View>
    </>
  )
}
