import { Text, View } from './ui'

/**
 * Marks a gloss that is not in the language the reader chose.
 *
 * Roughly a quarter of entries carry only a French definition, so an English reader
 * meets French regularly. Showing it is right — a gloss beats a blank — but showing it
 * unannounced is not: `fɛŋgɛ / léger(ère) sans poids` reads as a broken translation
 * rather than a French one. The tag is deliberately quiet: it sits at caption weight in
 * secondary colour, because it is a footnote about the text, not part of it.
 */
export const LanguageTag = ({ language }: { language: 'fr' | 'en' }) => (
  <View className="bg-background-tertiary self-start rounded px-1.5 py-0.5">
    <Text variant="small" weight="medium" className="text-foreground-secondary uppercase">
      {language}
    </Text>
  </View>
)
