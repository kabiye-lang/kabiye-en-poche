import { ScrollView, TouchableOpacity } from 'react-native'

import { Link } from 'expo-router'

import { useLingui } from '@lingui/react/macro'

import { CaretRightIcon } from '@/components/icons'
import { Card, Gradient, Text, View } from '@/components/ui'
import { units } from '@/utils/units'

const HomeScreen = () => {
  const { t } = useLingui()

  return (
    <View flex safeArea="top" className="bg-grey">
      <ScrollView className="px-2.5 py-5">
        <View flex className="px-2.5">
          {/* Redesigned Top Card */}
          <Card padding="none" className="mb-5">
            <Gradient colors={['#6200EE', '#03DAC6']}>
              <View className="flex-col items-start justify-center p-5">
                <Text variant="h1" weight="bold" color="white" className="mb-2.5">
                  {t`Welcome to Kabiyè en Poche`}
                </Text>
                <Text variant="h5" weight="medium" color="white" className="mt-2.5">
                  {t`Learn Kabiyè in a fun and interactive way`}
                </Text>
              </View>
            </Gradient>
          </Card>

          <View className="mb-5">
            <Text variant="h5" weight="semibold" className="mb-2.5">
              {t`Learning Units`}
            </Text>
            <View className="flex-row flex-wrap justify-between">
              {units.slice(0, 3).map((unit) => (
                <View className="mb-2.5 w-[48%]" key={unit.id}>
                  <Card className="h-[170px] px-4 py-2.5">
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
                <Card className="h-[170px] !bg-accent p-5">
                  <Link href="/units" asChild>
                    <TouchableOpacity className="flex-1">
                      <View className="h-full flex-row items-center justify-center">
                        <Text variant="h6" weight="bold" color="white">
                          {t`Show More`}
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
              {t`Tips & Resources`}
            </Text>
            <Card className="mb-2.5 flex-row items-center p-5">
              <Link href="/resources/tips" className="w-full flex-row items-center justify-between">
                <TouchableOpacity className="w-full flex-row items-center">
                  <View className="flex-1">
                    <Text variant="h6" weight="bold" color="primary" className="mt-2.5">
                      {t`Learning Tips`}
                    </Text>
                    <Text variant="caption" color="grey" className="mt-2.5">
                      {t`Get tips to improve your learning`}
                    </Text>
                  </View>
                  <CaretRightIcon size={24} color="#6200EE" />
                </TouchableOpacity>
              </Link>
            </Card>
            <Card className="mb-2.5 flex-row items-center p-5">
              <Link href="/resources/materials" className="w-full flex-row items-center justify-between">
                <TouchableOpacity className="w-full flex-row items-center">
                  <View className="flex-1">
                    <Text variant="h6" weight="bold" color="primary" className="mt-2.5">
                      {t`Reference Materials`}
                    </Text>
                    <Text variant="caption" color="grey" className="mt-2.5">
                      {t`Access additional learning materials`}
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
