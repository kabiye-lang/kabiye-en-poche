import DictionaryScreen from '@/screens/dictionary/dictionary'
import DictionaryPdfScreen from '@/screens/dictionary/dictionary-pdf'

export default function DictionaryTab() {
  if (process.env.EXPO_PUBLIC_FULL_DICTIONARY) {
    return <DictionaryScreen />
  }
  return <DictionaryPdfScreen />
}
