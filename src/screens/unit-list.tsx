import React from 'react'
import { ScrollView, TouchableOpacity } from 'react-native'

import { Link } from 'expo-router'

import { Card, Text, View } from '@/components/ui'
import { units } from '@/utils/units'

const UnitListScreen = () => {
  return (
    <View flex className="bg-bg-grey">
      <ScrollView contentContainerStyle={{ paddingVertical: 20, paddingHorizontal: 10 }}>
        <View className="flex-row flex-wrap justify-between">
          {units.map((unit) => (
            <View className="mb-2.5 w-[48%]" key={unit.id}>
              <Card className="h-[160px] px-4 py-2.5">
                <Link href={`/unit/${unit.id}`} asChild>
                  <TouchableOpacity className="flex-1">
                    <View className="flex-1">
                      <Text variant="h6" weight="bold" color="primary" className="mt-2.5">
                        {unit.name}
                      </Text>
                      <Text variant="caption" color="grey" className="mt-2.5">
                        {unit.description}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Link>
              </Card>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

export default UnitListScreen
