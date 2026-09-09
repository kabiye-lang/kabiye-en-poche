import type { EntryData } from '../../types/dictionary'

import { useState } from 'react'
import { Pressable } from 'react-native'

import { Link } from 'expo-router'

import { useLingui } from '@lingui/react/macro'

import { resolveTranslation } from '../../utils/dictionary-helpers'
import { ArrowRightIcon } from '../icons'
import { LanguageTag } from '../language-tag'
import { Card, Text, View } from '../ui'

type Translation = 'fr' | 'en'

type Definition = EntryData['senses'][number]['definitions'][number]

/**
 * One definition line in the reader's language, with the truth about where it came from.
 *
 * Three cases. The dictionary's own gloss in the reader's language: just the text. A
 * gloss only in the other language: the text with an "FR"/"EN" tag, as before. A gloss
 * the pipeline translated into the reader's language: the text with a "translated" tag
 * that swaps in the dictionary's original wording and back -- a reader who sees "too bad"
 * can check that the book says "tant pis". `pɩtɩna-m` was the report: an English reader
 * met French with a chip and nothing else.
 */
export const GlossLine = ({
  definition,
  translation,
  prefix,
}: {
  definition: Definition
  translation: Translation
  prefix?: string
}) => {
  const [showOriginal, setShowOriginal] = useState(false)
  const gloss = resolveTranslation(definition.translations, translation, definition.definition, definition.machine)
  const showing = showOriginal && gloss.original ? gloss.original : { text: gloss.text, language: gloss.language }
  return (
    <View className="mb-1 flex-row items-baseline gap-2">
      <Text variant="body" className="text-foreground flex-1">
        {prefix}
        {showing.text}
      </Text>
      {gloss.isMachine && gloss.original ? (
        <LanguageTag
          language={gloss.original.language}
          machine
          showingOriginal={showOriginal}
          onPress={() => setShowOriginal((v) => !v)}
        />
      ) : gloss.isFallback && gloss.language ? (
        <LanguageTag language={gloss.language} />
      ) : null}
    </View>
  )
}

/** Definitions within each sense */
export const SenseDefinitions = ({
  senses,
  translation,
}: {
  senses: EntryData['senses']
  translation: Translation
}) => {
  const { t } = useLingui()
  if (!senses || senses.length === 0) return null

  return (
    <View className="mb-4">
      <Text variant="h6" weight="bold" className="text-foreground mb-2">
        {t`Definitions`}
      </Text>
      {senses.map((sense, senseIdx) => (
        <View key={senseIdx} className="mb-4">
          {sense.definitions.map((def, defIdx) => {
            return (
              <View key={defIdx} className="mb-3">
                <GlossLine
                  definition={def}
                  translation={translation}
                  prefix={`${sense.senseNumber || senseIdx + 1}.${defIdx + 1} `}
                />
                {def.grammar && (
                  <Text variant="caption" className="text-foreground-secondary mb-1 italic">
                    {def.grammar}
                  </Text>
                )}
              </View>
            )
          })}

          <WordExamples examples={sense.examples} />
          <LexicalReferences lexRefs={sense.lexRefs} />
        </View>
      ))}
    </View>
  )
}

/** Examples within a sense */
export const WordExamples = ({ examples }: { examples: EntryData['senses'][number]['examples'] }) => {
  const { t } = useLingui()
  if (!examples || examples.length === 0) return null

  return (
    <View className="mt-2 ml-4">
      <Text variant="body" weight="semibold" className="text-foreground-secondary mb-1">
        {t`Examples:`}
      </Text>
      {examples.map((example, exIdx) => (
        <View key={exIdx} className="mb-2">
          {example.source && (
            <Text variant="body" className="text-foreground italic">
              {`"${example.source}"`}
            </Text>
          )}
          {example.translation && (
            <Text variant="caption" className="text-foreground-secondary mt-0.5">
              {example.translation}
            </Text>
          )}
        </View>
      ))}
    </View>
  )
}

/** Lexical references (related words) at the sense level */
export const LexicalReferences = ({ lexRefs }: { lexRefs: EntryData['senses'][number]['lexRefs'] }) => {
  if (!lexRefs || lexRefs.length === 0) return null

  return (
    <View className="mt-2 ml-4">
      {lexRefs.map((ref, refIdx) => (
        <View key={refIdx} className="mb-2">
          <Text variant="caption" className="text-foreground-secondary mb-1">
            {ref.type}:
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {ref.targets.map((target, targetIdx) => (
              <Link key={targetIdx} href={`/word/${encodeURIComponent(target)}`} asChild>
                <Pressable>
                  <View className="bg-primary/10 flex-row items-center rounded px-2 py-1">
                    <Text variant="caption" className="text-primary">
                      {target}
                    </Text>
                    <ArrowRightIcon size={12} className="text-primary ml-1" />
                  </View>
                </Pressable>
              </Link>
            ))}
          </View>
        </View>
      ))}
    </View>
  )
}

/** Sub-entries (related expressions) */
export const SubEntries = ({
  subEntries,
  translation,
}: {
  subEntries: EntryData['subEntries']
  translation: Translation
}) => {
  const { t } = useLingui()
  if (!subEntries || subEntries.length === 0) return null

  return (
    <View className="mb-4">
      <Text variant="h6" weight="bold" className="text-foreground mb-2">
        {t`Related Expressions`}
      </Text>
      {subEntries.map((subEntry, subIdx) => (
        <Card key={subIdx} className="mb-3 p-3">
          <Text kabiye variant="lg" weight="semibold" className="text-primary mb-1">
            {subEntry.headword}
          </Text>
          {subEntry.type && (
            <Text variant="caption" className="text-foreground-secondary mb-2 italic">
              ({subEntry.type})
            </Text>
          )}
          {subEntry.senses.map((sense, senseIdx) => (
            <View key={senseIdx} className="mb-2">
              {sense.definitions.map((def, defIdx) => (
                <GlossLine
                  key={defIdx}
                  definition={def}
                  translation={translation}
                  prefix={sense.senseNumber ? `${sense.senseNumber}. ` : ''}
                />
              ))}
              {sense.examples && sense.examples.length > 0 && (
                <View className="mt-1 ml-3">
                  {sense.examples.map((example, exIdx) => (
                    <View key={exIdx} className="mb-1">
                      {example.source && (
                        <Text variant="caption" className="text-foreground italic">
                          {`"${example.source}"`}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
              {sense.lexRefs && sense.lexRefs.length > 0 && (
                <View className="mt-1 ml-3">
                  {sense.lexRefs.map((ref, refIdx) => (
                    <View key={refIdx} className="mb-1">
                      <Text variant="caption" className="text-foreground-secondary">
                        {ref.type}:{' '}
                        {ref.targets.map((target, targetIdx) => (
                          <Link key={targetIdx} href={`/word/${encodeURIComponent(target)}`} asChild>
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
  )
}

/** Cross references (see also) */
export const CrossReferences = ({ crossRefs }: { crossRefs: EntryData['crossRefs'] }) => {
  const { t } = useLingui()
  if (!crossRefs || crossRefs.length === 0) return null

  return (
    <View className="mb-4">
      <Text variant="h6" weight="bold" className="text-foreground mb-2">
        {t`See Also`}
      </Text>
      {crossRefs.map((ref, refIdx) => (
        <View key={refIdx} className="mb-2">
          <Text variant="caption" className="text-foreground-secondary mb-1">
            {ref.type}:
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {ref.targets.map((target, targetIdx) => (
              <Link key={targetIdx} href={`/word/${encodeURIComponent(target)}`} asChild>
                <Pressable>
                  <View className="bg-primary/10 flex-row items-center rounded px-2 py-1">
                    <Text variant="caption" className="text-primary">
                      {target}
                    </Text>
                    <ArrowRightIcon size={12} className="text-primary ml-1" />
                  </View>
                </Pressable>
              </Link>
            ))}
          </View>
        </View>
      ))}
    </View>
  )
}
