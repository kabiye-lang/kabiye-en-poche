import { FlatList } from 'react-native'

import { router } from 'expo-router'

import Markdown from '@jonasmerlin/react-native-markdown-display'
import { useLingui } from '@lingui/react/macro'

import { Card, ScreenTitle, Text, View } from '@/components/ui'
import alphabetList from '@/utils/data/alphabet.json'
import { LETTER_TYPE_COLORS, MARKDOWN_STYLE } from '@/utils/design-system-nativewind'

export default function AlphabetListScreen() {
  const { t } = useLingui()
  return (
    <View flex className="bg-white dark:bg-gray-900">
      <FlatList
        numColumns={3}
        data={alphabetList}
        contentContainerStyle={{ paddingHorizontal: 15, gap: 5, paddingBottom: 20 }}
        columnWrapperStyle={{ maxWidth: '33.33%', gap: 5 }}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={() => (
          <>
            <ScreenTitle title={t`I learn the Kabiyè Alphabet`} />
            <View>
              <Markdown
                style={MARKDOWN_STYLE}
              >{`Le **Kabiyè** est écrit de façon qu'en général il y ait un seul symbole (graphème) pour chaque son utile
                (phonème). Pour des raisons d'économie, certains sons sont symbolisés par deux lettres. Par exemple: kp,
                **gb, aɣ, eɣ, iɣ, et ɩɣ**. Comme chacun de ces symboles représente un son distinct des autres, ils sont
                introduits dans l'alphabet.

Il y a des lettres dans l'orthographe du kabiyè qui n'existent pas en français. Chaque lettre est là pour représenter un son utile dans le parler Kabiyè et pour éliminer des ambiguïtés dans l'écriture. Donc, parmi les voyelles vous trouvez **ɛ, ɩ, ɔ, et ʋ**. Parmi les consonnes vous trouvez **ɖ, ñ et ŋ**.

Le symbole **ɣ** (appelé «gamma») marque en général une modification et une longueur des voyelles qu'il suit. Mais dans quelques mots il a la fonction d'une consonne. (Par exemple: **sooɣa** «petit mortier», **hoɣa** «enceinte»).

**Les mots dans le dictionnaire Kabiyè sont rangées dans l'ordre suivant:**
            `}</Markdown>
            </View>
          </>
        )}
        renderItem={({ item }) => (
          <View className="relative w-full items-center">
            <Card
              className="h-[100px] w-full flex-1 items-center justify-center"
              onPress={() =>
                router.push({
                  pathname: '/alphabet/[letter]',
                  params: { letter: item.id },
                })
              }
            >
              <View center>
                <Card
                  className="mb-2 rounded-full px-2 py-1"
                  backgroundColor={LETTER_TYPE_COLORS[item.type as keyof typeof LETTER_TYPE_COLORS]}
                >
                  <Text variant="small" weight="medium" className="text-white">
                    {item.type === 'vowel' ? t`Vowel` : item.type === 'consonant' ? t`Consonant` : t`Grapheme`}
                  </Text>
                </Card>

                <Text variant="h2" weight="medium" className="text-center">
                  {item.id}
                </Text>
              </View>
            </Card>
          </View>
        )}
      />
    </View>
  )
}
