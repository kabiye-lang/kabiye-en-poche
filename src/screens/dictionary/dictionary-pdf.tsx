import { StyleSheet } from 'react-native'
import { WebView } from 'react-native-webview'

export default function DictionaryPdfScreen() {
  return (
    <WebView
      style={styles.container}
      source={{
        uri: 'https://www.ingeniumlink.com/kbp-dict.pdf?dl=0',
      }}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
