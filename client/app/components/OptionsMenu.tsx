import React, { useRef, useEffect } from 'react';
import { Animated, TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Option {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    action: () => void | Promise<void>;
    color?: string;
};

interface OptionsMenuProps {
  visible: boolean;
  options: Option[];
  position?: { x: number; y: number };
  onClose?: () => void;
  customStyle?: ViewStyle;
};

const OptionsMenu: React.FC<OptionsMenuProps> = ({ visible, position, options, onClose, customStyle }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      if (!visible) onClose?.();
    });
  }, [visible]);

  if (!visible) return null;

  const handleAction = (action: Function, index?: number) => {
    action(index); // передаем index, если он есть
  };

  return (
    <Animated.View style={[styles.optionsMenu, position && { position: 'absolute', left: position.x, top: position.y, }, customStyle, { opacity: fadeAnim }]}>
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
  );
};

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
    minWidth: 150,
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
});

export default OptionsMenu;
