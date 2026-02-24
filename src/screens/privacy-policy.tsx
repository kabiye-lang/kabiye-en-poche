import { ScrollView } from 'react-native'

import Markdown from '@jonasmerlin/react-native-markdown-display'
import { useLingui } from '@lingui/react/macro'

import { useAppCmsPage } from '@/hooks/use-app-data'
import { MARKDOWN_STYLE } from '@/utils/design-system-nativewind'

import { Text, View } from '../components/ui'

export default function PrivacyPolicyScreen() {
  const { t } = useLingui()
  const { data: privacyPage, isLoading, error } = useAppCmsPage('privacy-policy')

  if (isLoading) {
    return (
      <View className="bg-background flex-1" safeArea="vertical">
        <View className="flex-1 items-center justify-center">
          <Text className="mt-4">{t`Loading privacy policy...`}</Text>
        </View>
      </View>
    )
  }

  if (error || !privacyPage) {
    return (
      <View className="bg-background flex-1" safeArea="vertical">
        <View className="flex-1 items-center justify-center px-4">
          <Text variant="h6" className="text-primary text-center">
            {t`Privacy Policy not found`}
          </Text>
          <Text variant="caption" className="text-foreground-secondary mt-2 text-center">
            {error?.message || t`Privacy policy is not available`}
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View className="bg-background flex-1 p-2" safeArea="vertical">
      <ScrollView className="flex-1 pt-12" showsVerticalScrollIndicator={false}>
        <Markdown style={MARKDOWN_STYLE}>{privacyPage.content_fr}</Markdown>
      </ScrollView>
    </View>
  )
}
