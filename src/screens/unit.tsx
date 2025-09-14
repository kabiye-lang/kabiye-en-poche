import React from 'react'
import { ScrollView, TouchableOpacity } from 'react-native'

import { Link, useLocalSearchParams } from 'expo-router'

import { useLingui } from '@lingui/react/macro'

import { CaretRightIcon } from '@/components/icons'
import { Card, Text, View } from '@/components/ui'
import { lessons } from '@/utils/units'

const UnitScreen = () => {
  const { t } = useLingui()
  const { id } = useLocalSearchParams()
  // @ts-expect-error id undefined
  const unitLessons = lessons[id]

  return (
    <View flex className="bg-bg-grey">
      <ScrollView contentContainerStyle={{ paddingVertical: 20, paddingHorizontal: 10 }}>
        <View flex className="px-2.5 pt-5">
          <Text variant="h3" weight="bold" color="dark" className="mb-5">
            {t`Lessons`}
          </Text>
          {/* @ts-expect-error any */}
          {unitLessons.map((lesson) => (
            <Card key={lesson.id} className="mb-5 p-5">
              <Link href={`/lesson/${lesson.id}`} asChild>
                <TouchableOpacity>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text variant="h6" weight="bold" color="primary" className="mb-2.5">
                        {lesson.name}
                      </Text>
                      <Text variant="caption" color="grey" className="mb-2.5">
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

export default UnitScreen
