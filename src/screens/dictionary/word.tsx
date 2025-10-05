import React from 'react'
import { ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native'

import { Link, useLocalSearchParams } from 'expo-router'

import { useLingui } from '@lingui/react/macro'
import { useHeaderHeight } from '@react-navigation/elements'

import { ArrowRightIcon } from '@/components/icons'
import { Card, Text, View } from '@/components/ui'
import { useEntry } from '@/hooks/use-dictionary'
import { useLanguage } from '@/hooks/use-language'
import { isRedirectEntry } from '@/utils/dictionary-helpers'

const WordDetailsScreen: React.FC = () => {
  const { id: headword } = useLocalSearchParams<{ id: string }>()
  const { t } = useLingui()
  const { currentLanguage } = useLanguage()
  const { data: entry, isLoading, error } = useEntry(headword || '')
  const headerHeight = useHeaderHeight()
  if (isLoading) {
    return (
      <View flex className="items-center justify-center bg-bg-grey dark:bg-gray-900">
        <ActivityIndicator size="large" className="text-primary" />
        <Text variant="body" className="mt-4 text-text-grey dark:text-gray-400">
          {t`Loading...`}
        </Text>
      </View>
    )
  }

  if (error || !entry) {
    return (
      <View flex className="items-center justify-center bg-bg-grey px-4 dark:bg-gray-900">
        <Text variant="h6" className="text-center text-red-500">
          {t`Word not found`}
        </Text>
        <Text variant="body" className="mt-2 text-center text-text-grey dark:text-gray-400">
          {t`The word you're looking for doesn't exist in our dictionary`}
        </Text>
      </View>
    )
  }

  const { entry_data } = entry
  const translation = currentLanguage === 'fr' ? 'fr' : 'en'

  // Handle redirect entries
  if (isRedirectEntry(entry)) {
    return (
      <View flex className="bg-bg-grey dark:bg-gray-900" safeArea="vertical">
        <ScrollView contentContainerStyle={{ paddingTop: headerHeight / 2, paddingHorizontal: 20 }}>
          <Card className="p-5">
            <Text variant="h4" weight="bold" className="mb-3 text-text-dark dark:text-gray-100">
              {entry_data.headword}
            </Text>
            <Text variant="body" className="mb-4 text-text-grey dark:text-gray-400">
              {t`This is a variant form. See the main entry for the full definition.`}
            </Text>
            <Link href={`/word/${entry_data.mainEntry}`} asChild>
              <TouchableOpacity>
                <View className="flex-row items-center rounded-lg bg-primary px-4 py-3">
                  <Text variant="lg" weight="semibold" className="flex-1 text-white">
                    {t`View main entry:`} {entry_data.mainEntry}
                  </Text>
                  <ArrowRightIcon size={20} className="text-white" />
                </View>
              </TouchableOpacity>
            </Link>
          </Card>
        </ScrollView>
      </View>
    )
  }

  return (
    <View flex className="bg-bg-grey dark:bg-gray-900" safeArea="vertical">
      <ScrollView contentContainerStyle={{ paddingTop: headerHeight / 2, paddingHorizontal: 20 }}>
        {/* Headword */}
        <Text variant="h3" weight="bold" className="mb-2 text-primary">
          {entry_data.headword}
        </Text>

        {/* Pronunciations */}
        {entry_data.pronunciations && entry_data.pronunciations.length > 0 && (
          <Text variant="lg" className="mb-2 text-text-grey dark:text-gray-400">
            [{entry_data.pronunciations.join(', ')}]
          </Text>
        )}

        {/* Grammatical Info */}
        {entry_data.grammaticalInfo && (
          <Text variant="body" className="mb-4 italic text-text-grey dark:text-gray-400">
            {entry_data.grammaticalInfo}
          </Text>
        )}

        {/* Plural */}
        {entry_data.plural && (
          <View className="mb-4">
            <Text variant="body" className="text-text-dark dark:text-gray-200">
              <Text weight="semibold">{t`Plural:`}</Text> {entry_data.plural}
            </Text>
          </View>
        )}

        {/* Variant Forms */}
        {entry_data.variantRefs && entry_data.variantRefs.length > 0 && (
          <View className="mb-4">
            <Text variant="h6" weight="bold" className="mb-2 text-text-dark dark:text-gray-100">
              {t`Variant Forms`}
            </Text>
            {entry_data.variantRefs.map((variant, idx) => (
              <Text key={idx} variant="body" className="mb-1 text-text-dark dark:text-gray-200">
                • {variant.variant}
                {variant.pronunciation && ` [${variant.pronunciation}]`}
              </Text>
            ))}
          </View>
        )}

        {/* Senses (Definitions) */}
        {entry_data.senses && entry_data.senses.length > 0 && (
          <View className="mb-4">
            <Text variant="h6" weight="bold" className="mb-2 text-text-dark dark:text-gray-100">
              {t`Definitions`}
            </Text>
            {entry_data.senses.map((sense, senseIdx) => (
              <View key={senseIdx} className="mb-4">
                {sense.definitions.map((def, defIdx) => (
                  <View key={defIdx} className="mb-3">
                    <Text variant="body" className="mb-1 text-text-dark dark:text-gray-200">
                      {sense.senseNumber || senseIdx + 1}.{defIdx + 1} {def.translations[translation]}
                    </Text>
                    {def.grammar && (
                      <Text variant="caption" className="mb-1 italic text-text-grey dark:text-gray-400">
                        {def.grammar}
                      </Text>
                    )}
                  </View>
                ))}

                {/* Examples */}
                {sense.examples && sense.examples.length > 0 && (
                  <View className="ml-4 mt-2">
                    <Text variant="body" weight="semibold" className="mb-1 text-text-grey dark:text-gray-400">
                      {t`Examples:`}
                    </Text>
                    {sense.examples.map((example, exIdx) => (
                      <View key={exIdx} className="mb-2">
                        {example.source && (
                          <Text variant="body" className="italic text-text-dark dark:text-gray-200">
                            {`"${example.source}"`}
                          </Text>
                        )}
                        {example.translation && (
                          <Text variant="caption" className="mt-0.5 text-text-grey dark:text-gray-400">
                            {example.translation}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {/* Lexical References (Sense Level) */}
                {sense.lexRefs && sense.lexRefs.length > 0 && (
                  <View className="ml-4 mt-2">
                    <Text variant="body" weight="semibold" className="mb-1 text-text-grey dark:text-gray-400">
                      {t`Related Words:`}
                    </Text>
                    {sense.lexRefs.map((ref, refIdx) => (
                      <View key={refIdx} className="mb-2">
                        <Text variant="caption" className="mb-1 text-text-grey dark:text-gray-400">
                          {ref.type}:
                        </Text>
                        <View className="flex-row flex-wrap gap-2">
                          {ref.targets.map((target, targetIdx) => (
                            <Link key={targetIdx} href={`/word/${target}`} asChild>
                              <TouchableOpacity>
                                <View className="flex-row items-center rounded bg-primary/10 px-2 py-1">
                                  <Text variant="caption" className="text-primary">
                                    {target}
                                  </Text>
                                  <ArrowRightIcon size={12} className="ml-1 text-primary" />
                                </View>
                              </TouchableOpacity>
                            </Link>
                          ))}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Sub-entries */}
        {entry_data.subEntries && entry_data.subEntries.length > 0 && (
          <View className="mb-4">
            <Text variant="h6" weight="bold" className="mb-2 text-text-dark dark:text-gray-100">
              {t`Related Expressions`}
            </Text>
            {entry_data.subEntries.map((subEntry, subIdx) => (
              <Card key={subIdx} className="mb-3 p-3">
                <Text variant="lg" weight="semibold" className="mb-1 text-primary">
                  {subEntry.headword}
                </Text>
                {subEntry.type && (
                  <Text variant="caption" className="mb-2 italic text-text-grey dark:text-gray-400">
                    ({subEntry.type})
                  </Text>
                )}
                {subEntry.senses.map((sense, senseIdx) => (
                  <View key={senseIdx} className="mb-2">
                    {sense.definitions.map((def, defIdx) => (
                      <Text key={defIdx} variant="body" className="mb-1 text-text-dark dark:text-gray-200">
                        {sense.senseNumber ? `${sense.senseNumber}. ` : ''}
                        {def.translations[translation]}
                      </Text>
                    ))}
                    {/* Examples in sub-entries */}
                    {sense.examples && sense.examples.length > 0 && (
                      <View className="ml-3 mt-1">
                        {sense.examples.map((example, exIdx) => (
                          <View key={exIdx} className="mb-1">
                            {example.source && (
                              <Text variant="caption" className="italic text-text-dark dark:text-gray-200">
                                {`"${example.source}"`}
                              </Text>
                            )}
                          </View>
                        ))}
                      </View>
                    )}
                    {/* Lexical References in sub-entries */}
                    {sense.lexRefs && sense.lexRefs.length > 0 && (
                      <View className="ml-3 mt-1">
                        {sense.lexRefs.map((ref, refIdx) => (
                          <View key={refIdx} className="mb-1">
                            <Text variant="caption" className="text-text-grey dark:text-gray-400">
                              {ref.type}:{' '}
                              {ref.targets.map((target, targetIdx) => (
                                <Link key={targetIdx} href={`/word/${target}`} asChild>
                                  <Text variant="caption" className="text-primary">
                                    {target}
                                    {targetIdx < ref.targets.length - 1 ? ', ' : ''}
                                  </Text>
                                </Link>
                              ))}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </Card>
            ))}
          </View>
        )}

        {/* Cross References */}
        {entry_data.crossRefs && entry_data.crossRefs.length > 0 && (
          <View className="mb-4">
            <Text variant="h6" weight="bold" className="mb-2 text-text-dark dark:text-gray-100">
              {t`See Also`}
            </Text>
            {entry_data.crossRefs.map((ref, refIdx) => (
              <View key={refIdx} className="mb-2">
                <Text variant="caption" className="mb-1 text-text-grey dark:text-gray-400">
                  {ref.type}:
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {ref.targets.map((target, targetIdx) => (
                    <Link key={targetIdx} href={`/word/${target}`} asChild>
                      <TouchableOpacity>
                        <View className="flex-row items-center rounded bg-primary/10 px-2 py-1">
                          <Text variant="caption" className="text-primary">
                            {target}
                          </Text>
                          <ArrowRightIcon size={12} className="ml-1 text-primary" />
                        </View>
                      </TouchableOpacity>
                    </Link>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

export default WordDetailsScreen
