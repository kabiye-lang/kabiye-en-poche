import { useTranslation } from 'react-i18next'
import { ScrollView, TouchableOpacity } from 'react-native'

import { Link } from 'expo-router'

import { CaretRightIcon } from '@/components/icons'
import { Card, Gradient, Text, View } from '@/components/ui'
import { units } from '@/utils/units'

const HomeScreen = () => {
  const { t } = useTranslation()

  return (
    <View flex className="bg-grey pt-12">
      <ScrollView className="px-2.5 py-5">
        <View flex className="px-2.5">
          {/* Redesigned Top Card */}
          <Card variant="elevated" padding="none" className="mb-5">
            <Gradient colors={['#6200EE', '#03DAC6']}>
              <View className="flex-col items-start justify-center p-5">
                <Text variant="h1" weight="bold" color="white" className="mb-2.5">
                  {t('home.screen.learn_kabiye')}
                </Text>
                <Text variant="h5" weight="medium" color="white" className="mt-2.5">
                  {t('home.screen.learn_description')}
                </Text>
              </View>
            </Gradient>
          </Card>

          <View className="mb-5">
            <Text variant="h5" weight="semibold" className="mb-2.5">
              {t('home.screen.learning_units')}
            </Text>
            <View className="flex-row flex-wrap justify-between">
              {units.slice(0, 3).map((unit) => (
                <View className="mb-2.5 w-[48%]" key={unit.id}>
                  <Card variant="elevated" className="h-[170px] px-4 py-2.5">
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
              <View className="mb-2.5 w-[48%]">
                <Card variant="elevated" className="h-[170px] !bg-accent p-5">
                  <Link href="/units" asChild>
                    <TouchableOpacity className="flex-1">
                      <View className="h-full flex-row items-center justify-center">
                        <Text variant="h6" weight="bold" color="white">
                          {t('home.screen.show_more')}
                        </Text>
                        <View className="ml-2.5">
                          <CaretRightIcon size={24} color="#FFFFFF" />
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Link>
                </Card>
              </View>
            </View>
          </View>

          <View className="mb-5">
            <Text variant="h5" weight="semibold" className="mb-2.5">
              {t('home.screen.tips_resources')}
            </Text>
            <Card variant="elevated" className="mb-2.5 flex-row items-center p-5">
              <Link href="/resources/tips" className="w-full flex-row items-center justify-between">
                <TouchableOpacity className="w-full flex-row items-center">
                  <View className="flex-1">
                    <Text variant="h6" weight="bold" color="primary" className="mt-2.5">
                      {t('home.screen.learning_tips')}
                    </Text>
                    <Text variant="caption" color="grey" className="mt-2.5">
                      {t('home.screen.learning_tips_description')}
                    </Text>
                  </View>
                  <CaretRightIcon size={24} color="#6200EE" />
                </TouchableOpacity>
              </Link>
            </Card>
            <Card variant="elevated" className="mb-2.5 flex-row items-center p-5">
              <Link href="/resources/materials" className="w-full flex-row items-center justify-between">
                <TouchableOpacity className="w-full flex-row items-center">
                  <View className="flex-1">
                    <Text variant="h6" weight="bold" color="primary" className="mt-2.5">
                      {t('home.screen.reference_materials')}
                    </Text>
                    <Text variant="caption" color="grey" className="mt-2.5">
                      {t('home.screen.reference_materials_description')}
                    </Text>
                  </View>
                  <CaretRightIcon size={24} color="#6200EE" />
                </TouchableOpacity>
              </Link>
            </Card>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default HomeScreen
