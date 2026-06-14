import { ActivityIndicator, ScrollView } from 'react-native'

import { useLingui } from '@lingui/react/macro'

import { AppMarkdown } from '../components/markdown'
import { Text, View } from '../components/ui'
import { useAppCmsPage } from '../hooks/use-app-data'
import { MARKDOWN_STYLE } from '../utils/design-system-nativewind'

export default function TermsAndConditionsScreen() {
  const { t } = useLingui()
  const { data: termsPage, isLoading, error } = useAppCmsPage('terms-and-conditions')

  if (isLoading) {
    return (
      <View className="bg-background flex-1" safeArea="vertical">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" className="text-primary" />
          <Text className="mt-4">{t`Loading terms...`}</Text>
        </View>
      </View>
    )
  }

  if (error || !termsPage) {
    return (
      <View className="bg-background flex-1" safeArea="vertical">
        <View className="flex-1 items-center justify-center px-4">
          <Text variant="h6" className="text-primary text-center">
            {t`Terms not found`}
          </Text>
          <Text variant="caption" className="text-foreground-secondary mt-2 text-center">
            {error?.message || t`Terms and conditions are not available`}
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View className="bg-background flex-1 p-2" safeArea="vertical">
      <ScrollView className="flex-1 pt-12" showsVerticalScrollIndicator={false}>
        <AppMarkdown style={MARKDOWN_STYLE}>{termsPage.content_fr}</AppMarkdown>
      </ScrollView>
    </View>
  )
}
