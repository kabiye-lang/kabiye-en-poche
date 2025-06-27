import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native'
import { Card, Colors, Text, View } from 'react-native-ui-lib'

import { Link, useLocalSearchParams } from 'expo-router'

import { CaretRightIcon } from '@/components/icons'
import { lessons } from '@/utils/units'

const UnitScreen = () => {
  const { t } = useTranslation()
  const { id } = useLocalSearchParams()
  // @ts-expect-error id undefined
  const unitLessons = lessons[id]

  return (
    <View flex useSafeArea bg-bgGrey>
      <ScrollView contentContainerStyle={{ paddingVertical: 20, paddingHorizontal: 10 }}>
        <View flex paddingH-10 paddingT-20>
          <Text text60 marginB-20 style={{ fontWeight: 'bold', color: Colors.textDark }}>
            {t('unit.screen.lessons')}
          </Text>
          {/* @ts-expect-error any */}
          {unitLessons.map((lesson) => (
            <Card key={lesson.id} marginB-20 padding-20 style={styles.card}>
              <Link href={`/lesson/${lesson.id}`} asChild>
                <TouchableOpacity>
                  <View style={styles.cardContent}>
                    <View style={styles.textContainer}>
                      <Text text70 marginB-10 style={{ fontWeight: 'bold', color: Colors.primary }}>
                        {lesson.name}
                      </Text>
                      <Text text80 marginB-10 style={{ color: Colors.textGrey }}>
                        {lesson.description}
                      </Text>
                    </View>
                    <CaretRightIcon size={24} />
                  </View>
                </TouchableOpacity>
              </Link>
            </Card>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
})

export default UnitScreen
