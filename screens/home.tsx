import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native'
import { Card, Colors, View } from 'react-native-ui-lib'

import { LinearGradient } from 'expo-linear-gradient'
import { Link } from 'expo-router'

import { CaretRightIcon } from '@/components/icons'
import { Text } from '@/components/themed'
import { units } from '@/utils/units'

const HomeScreen = () => {
  const { t } = useTranslation()

  return (
    <View flex useSafeArea backgroundColor={Colors.bgGrey}>
      <ScrollView contentContainerStyle={{ paddingVertical: 20, paddingHorizontal: 10 }}>
        <View flex paddingH-10>
          {/* Redesigned Top Card */}
          <Card marginB-20 padding-0 style={styles.cardShadow}>
            <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.gradient}>
              <View style={styles.cardContent}>
                <Text text50 white marginB-10 family="fig7">
                  {t('home.screen.learn_kabiye')}
                </Text>
                <Text text70 white marginT-10 family="fig5">
                  {t('home.screen.learn_description')}
                </Text>
              </View>
            </LinearGradient>
          </Card>

          <View marginB-20>
            <Text h5 marginB-10 family="ibm6">
              {t('home.screen.learning_units')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {units.slice(0, 3).map((unit) => (
                <View style={{ width: '48%', marginBottom: 10 }} key={unit.id}>
                  <Card
                    paddingH-15
                    paddingV-10
                    style={{
                      backgroundColor: Colors.white,
                      borderRadius: 12,
                      height: 170,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 2,
                    }}
                  >
                    <Link href={`/unit/${unit.id}`} asChild>
                      <TouchableOpacity>
                        <View>
                          <Text text70 marginT-10 style={{ fontWeight: 'bold', color: Colors.primary }}>
                            {unit.name}
                          </Text>
                          <Text text80 marginT-10 style={{ color: Colors.textGrey }}>
                            {unit.description}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </Link>
                  </Card>
                </View>
              ))}
              <View style={{ width: '48%', marginBottom: 10 }}>
                <Card
                  padding-20
                  style={{
                    backgroundColor: Colors.accent,
                    borderRadius: 12,
                    height: 170,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 2,
                  }}
                >
                  <Link href="/units" asChild>
                    <TouchableOpacity>
                      <View
                        style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: '100%' }}
                      >
                        <Text text70 white style={{ fontWeight: 'bold' }}>
                          {t('home.screen.show_more')}
                        </Text>
                        <CaretRightIcon size={24} color={Colors.textLight} style={{ marginLeft: 10 }} />
                      </View>
                    </TouchableOpacity>
                  </Link>
                </Card>
              </View>
            </View>
          </View>

          <View marginB-20>
            <Text h5 marginB-10 family="ibm6">
              {t('home.screen.tips_resources')}
            </Text>
            <Card
              marginB-10
              padding-20
              style={{
                backgroundColor: Colors.white,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 2,
              }}
            >
              <Link
                href="/resources/tips"
                style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                  <View style={{ flex: 1 }}>
                    <Text text70 marginT-10 style={{ fontWeight: 'bold', color: Colors.primary }}>
                      {t('home.screen.learning_tips')}
                    </Text>
                    <Text text80 marginT-10 style={{ color: Colors.textGrey }}>
                      {t('home.screen.learning_tips_description')}
                    </Text>
                  </View>
                  <CaretRightIcon size={24} />
                </TouchableOpacity>
              </Link>
            </Card>
            <Card
              marginB-10
              padding-20
              style={{
                backgroundColor: Colors.white,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 2,
              }}
            >
              <Link
                href="/resources/materials"
                style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                  <View style={{ flex: 1 }}>
                    <Text text70 marginT-10 style={{ fontWeight: 'bold', color: Colors.primary }}>
                      {t('home.screen.reference_materials')}
                    </Text>
                    <Text text80 marginT-10 style={{ color: Colors.textGrey }}>
                      {t('home.screen.reference_materials_description')}
                    </Text>
                  </View>
                  <CaretRightIcon size={24} />
                </TouchableOpacity>
              </Link>
            </Card>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  cardShadow: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  gradient: {
    borderRadius: 12,
    padding: 20,
  },
  cardContent: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  boldText: {
    fontWeight: 'bold',
  },
})

export default HomeScreen
