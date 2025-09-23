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
    <View flex className="bg-bg-grey dark:bg-gray-900" safeArea="top">
      <View className="px-2.5 py-2.5">
        <View className="flex-row items-center border-b border-gray-300 pb-2.5 dark:border-gray-600">
          <View className="mr-2.5">
            <MagnifyingGlassIcon size={24} className="text-text-grey dark:text-gray-400" />
          </View>
          <TextInput
            placeholder="Search for a word..."
            className="flex-1 text-base text-gray-900 dark:text-gray-100"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingTop: 10 }}>
        <View className="mt-2.5 px-2.5">
          <Text variant="h5" weight="semibold" className="mb-2.5">
            Recent searches
          </Text>
          {['1', '2'].map((item) => (
            <Link href="/dictionary/search?s=tes" asChild key={item}>
              <TouchableOpacity className="w-full flex-row items-center">
                <View row className="mb-1.5 items-center">
                  <ClockIcon size={20} className="text-text-grey dark:text-gray-400" />
                  <Text variant="body" className="ml-1.5 text-text-grey dark:text-gray-400">
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
            <Card key={category} className="mb-5 flex-row items-center px-5 py-2.5">
              <Link href={`/dictionary/${category}`}>
                <TouchableOpacity className="w-full flex-row items-center">
                  <View className="flex-1">
                    <Text variant="lg" weight="semibold" className="mt-1.5 text-primary">
                      {category}
                    </Text>
                    <Text variant="body" className="mt-1.5 text-text-grey dark:text-gray-400">
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
