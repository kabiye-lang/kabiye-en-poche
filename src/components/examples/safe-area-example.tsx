import React from 'react'

import { Text, View } from '@/components/ui'

/**
 * Example component demonstrating safe area usage
 * This shows how different safeArea props affect the layout
 */
export function SafeAreaExample() {
  return (
    <View flex className="bg-gray-100">
      {/* Full safe area - good for main content */}
      <View safeArea="all" className="mb-4 bg-blue-500 p-4">
        <Text className="text-center text-white">Full Safe Area (all edges)</Text>
      </View>

      {/* Top only - good for headers */}
      <View safeArea="top" className="mb-4 bg-green-500 p-4">
        <Text className="text-center text-white">Top Safe Area Only</Text>
      </View>

      {/* Bottom only - good for bottom navigation */}
      <View safeArea="bottom" className="mb-4 bg-purple-500 p-4">
        <Text className="text-center text-white">Bottom Safe Area Only</Text>
      </View>

      {/* Horizontal only - good for side margins */}
      <View safeArea="horizontal" className="mb-4 bg-orange-500 p-4">
        <Text className="text-center text-white">Horizontal Safe Area Only</Text>
      </View>

      {/* Vertical only - good for full-width content */}
      <View safeArea="vertical" className="mb-4 bg-red-500 p-4">
        <Text className="text-center text-white">Vertical Safe Area Only</Text>
      </View>

      {/* No safe area - for content that should extend to edges */}
      <View safeArea="none" className="bg-gray-600 p-4">
        <Text className="text-center text-white">No Safe Area (extends to edges)</Text>
      </View>
    </View>
  )
}
