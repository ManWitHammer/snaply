import React from 'react'
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'

interface Option {
    label: string
    icon: keyof typeof Ionicons.glyphMap
    action: () => void | Promise<void>
    color?: string
}

interface OptionsMenuProps {
  visible: boolean
  options: Option[]
  position?: { x: number, y: number }
  onClose?: () => void
  customStyle?: ViewStyle
}

const OptionsMenu: React.FC<OptionsMenuProps> = ({ visible, position, options, onClose, customStyle }) => {
  if (!visible) return null

  const handleAction = (action: Function, index?: number) => {
    action(index) 
    onClose && onClose()
  }

  return (
    <Animated.View 
      entering={FadeIn.duration(150)}
      exiting={FadeOut.duration(150)}
      style={[
        styles.optionsMenu, 
        position && { position: 'absolute', left: position.x, top: position.y }, 
        customStyle
      ]}
    >
      {options.map((option, index) => (
        <TouchableOpacity
          key={index}
          style={styles.optionItem}
          onPress={() => handleAction(option.action, index)}
        >
          <Ionicons name={option.icon} size={18} color={option.color || '#333'} />
          <Text style={[styles.optionText, option.color ? { color: option.color } : {}]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  optionsMenu: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 100,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  optionText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
})

export default OptionsMenu