import React from 'react'
import { ScrollView, TouchableOpacity } from 'react-native'

import { XIcon } from 'phosphor-react-native'

import { Button, Text, View } from '@/components/ui'

interface AudioDialogProps {
  onClose: () => void
}

const AudioDialog: React.FC<AudioDialogProps> = ({ onClose }) => {
  return (
    <View className="mb-0 mt-auto flex-1 rounded-xl bg-white">
      <View className="flex-row items-center border-b border-gray-300 p-4">
        <TouchableOpacity onPress={onClose}>
          <XIcon size={24} color="black" />
        </TouchableOpacity>
        <Text variant="h3" weight="bold" className="ml-5">
          Audio Dialog
        </Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 15 }}>
        <Text variant="body" color="dark" className="mb-4">
          Speaker 1: Hello! How are you?
        </Text>
        <Text variant="body" color="dark" className="mb-4">
          Speaker 2: I&apos;m fine, thank you! And you?
        </Text>
        <Text variant="body" color="dark" className="mb-4">
          Speaker 1: I&apos;m doing well, thank you!
        </Text>
        <Button
          variant="primary"
          onPress={() => {
            /* play audio */
          }}
        >
          Play Audio
        </Button>
      </ScrollView>
    </View>
  )
}

export default AudioDialog
