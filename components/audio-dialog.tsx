import React from 'react'
import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native'
import { Button, Colors, Text, View } from 'react-native-ui-lib'

import { XIcon } from 'phosphor-react-native'

interface AudioDialogProps {
  onClose: () => void
}

const AudioDialog: React.FC<AudioDialogProps> = ({ onClose }) => {
  return (
    <View style={styles.container} useSafeArea>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <XIcon size={24} color="black" />
        </TouchableOpacity>
        <Text text60 marginL-20 style={styles.title}>
          Audio Dialog
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.message}>Speaker 1: Hello! How are you?</Text>
        <Text style={styles.message}>Speaker 2: I'm fine, thank you! And you?</Text>
        <Text style={styles.message}>Speaker 1: I'm doing well, thank you!</Text>
        <Button
          label="Play Audio"
          onPress={() => {
            /* play audio */
          }}
        />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginTop: 'auto',
    marginBottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grey60,
  },
  title: {
    fontWeight: 'bold',
  },
  content: {
    padding: 15,
  },
  message: {
    marginBottom: 15,
    fontSize: 16,
    color: Colors.textDark,
  },
})

export default AudioDialog
