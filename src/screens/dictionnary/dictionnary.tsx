import React from 'react'
import { ScrollView, TextInput, TouchableOpacity } from 'react-native'

import { Link } from 'expo-router'

import { useLingui } from '@lingui/react/macro'
import { ClockIcon, MagnifyingGlassIcon } from 'phosphor-react-native'

import { CaretRightIcon } from '@/components/icons'
import { Card, Text, View } from '@/components/ui'

const DictionaryScreen: React.FC = () => {
  const { t } = useLingui()

  return (
    <View flex className="bg-bg-grey">
      <View className="px-2.5 py-2.5">
        <View className="flex-row items-center border-b border-gray-300 pb-2.5">
          <View className="mr-2.5">
            <MagnifyingGlassIcon size={24} color="#9CA3AF" />
          </View>
          <TextInput placeholder="Search for a word..." className="flex-1 text-base" placeholderTextColor="#9CA3AF" />
        </View>
      </View>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingTop: 10 }}>
        <View className="mt-2.5 px-2.5">
          <Text variant="h5" weight="semibold" className="mb-2.5">
            Recent searches
          </Text>
          {['1', '2'].map((item) => (
            <Link href="/dictionnary/search?s=tes" asChild key={item}>
              <TouchableOpacity className="w-full flex-row items-center">
                <View row className="mb-1.5 items-center">
                  <ClockIcon size={20} color="#9CA3AF" />
                  <Text variant="body" color="grey" className="ml-1.5">
                    Kabiyè Word {item}
                  </Text>
                </View>
              </TouchableOpacity>
            </Link>
          ))}
        </View>
        <View className="mt-5 px-2.5">
          <Text variant="h5" weight="semibold" className="mb-2.5">
            Categories
          </Text>
          {['Common Phrases', 'Vocabulary'].map((category) => (
            <Card key={category} variant="elevated" className="mb-5 flex-row items-center px-5 py-2.5">
              <Link href={`/dictionnary/${category}`}>
                <TouchableOpacity className="w-full flex-row items-center">
                  <View className="flex-1">
                    <Text variant="lg" weight="semibold" color="primary" className="mt-1.5">
                      {category}
                    </Text>
                    <Text variant="body" color="grey" className="mt-1.5">
                      {t`Get tips to improve your learning`}
                    </Text>
                  </View>
                  <CaretRightIcon size={24} />
                </TouchableOpacity>
              </Link>
            </Card>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

export default DictionaryScreen
