import { useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { WebView } from 'react-native-webview'

import { useLingui } from '@lingui/react/macro'

import { Text } from '@/components/ui'

export default function DictionaryPdfScreen() {
  const { t } = useLingui()
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleLoadStart = () => {
    setIsLoading(true)
    setHasError(false)
  }

  const handleLoadEnd = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" className="text-primary" />
          <Text variant="body" className="mt-4 text-center text-text-grey dark:text-gray-400">
            {t`Loading dictionary...`}
          </Text>
        </View>
      )}

      {hasError && (
        <View style={styles.errorContainer}>
          <Text variant="h6" className="text-center text-primary">
            {t`Failed to load dictionary`}
          </Text>
          <Text variant="caption" className="mt-2 text-center text-text-grey dark:text-gray-400">
            {t`Please check your internet connection and try again`}
          </Text>
        </View>
      )}

      <WebView
        style={[styles.webview, { opacity: isLoading || hasError ? 0 : 1 }]}
        source={{
          uri: 'https://www.ingeniumlink.com/kbp-dict.pdf?dl=0',
        }}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        startInLoadingState={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    zIndex: 1,
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    zIndex: 1,
  },
})
