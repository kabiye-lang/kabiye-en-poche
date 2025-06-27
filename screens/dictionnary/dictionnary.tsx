import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, TouchableOpacity } from 'react-native'
import { Card, Colors, TextField, View } from 'react-native-ui-lib'

import { Link } from 'expo-router'

import { Clock, MagnifyingGlass } from 'phosphor-react-native'

import { CaretRightIcon } from '@/components/icons'
import { Text } from '@/components/themed'

const DictionaryScreen: React.FC = () => {
  const { t } = useTranslation()

  return (
    <View useSafeArea flex backgroundColor={Colors.bgGrey}>
      <TextField
        placeholder="Search for a word..."
        leadingAccessory={
          <MagnifyingGlass size={24} color={Colors.grey30} style={{ marginBottom: 10, marginLeft: 5 }} />
        }
        style={{
          marginBottom: 10,
          paddingLeft: 5,
        }}
        fieldStyle={{
          borderBottomWidth: 1,
          borderColor: Colors.grey40,
        }}
      />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 10 }}>
        <View paddingH-10 marginT-10>
          <Text h5 marginB-10 family="ibm6">
            Recent searches
          </Text>
          {['1', '2'].map((item) => (
            <Link href="/dictionnary/search?s=tes" asChild key={item}>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                <View row marginB-5 centerV>
                  <Clock size={20} color={Colors.grey40} />
                  <Text normal color={Colors.textGrey} marginL-5 family="ibm5">
                    Kabiyè Word {item}
                  </Text>
                </View>
              </TouchableOpacity>
            </Link>
          ))}
        </View>
        <View paddingH-10 marginT-20>
          <Text h5 marginB-10 family="ibm6">
            Categories
          </Text>
          {['Common Phrases', 'Vocabulary'].map((category) => (
            <Card
              key={category}
              marginB-20
              paddingV-10
              paddingH-20
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
              <Link href={`/dictionnary/${category}`}>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                  <View style={{ flex: 1 }}>
                    <Text marginT-5 family="fig6" lg color={Colors.primary}>
                      {category}
                    </Text>
                    <Text marginT-5 color={Colors.textGrey}>
                      {t('home.screen.learning_tips_description')}
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
