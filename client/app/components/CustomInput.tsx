import { StyleSheet, Text, TextInput, View, TouchableOpacity, Dimensions } from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'

interface CustomInputProps {
  icon: string
  value: string
  placeholder: string
  onChangeText: (text: string) => void
  error?: string
  secureTextEntry?: boolean
  onToggleSecure?: () => void
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad'
  halfInput?: boolean
}

function CustomInput({
  icon,
  value,
  placeholder,
  onChangeText,
  error,
  secureTextEntry,
  onToggleSecure,
  keyboardType = 'default',
  halfInput
}: CustomInputProps) {
  return (
    <View style={[
      styles.container,
      halfInput && { width: Dimensions.get('window').width / 2 - 45.5 }
    ]}>
      <View style={styles.inputContainer}>
        <Ionicons name={icon} size={20} color="#fff" />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          placeholderTextColor="#ddd"
        />
        {onToggleSecure && (
          <TouchableOpacity onPress={onToggleSecure}>
            <Ionicons name={secureTextEntry ? 'eye-off-outline' : 'eye-outline'} size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 5,
    width: "100%"
  },
  input: {
    flex: 1,
    marginLeft: 10,
    color: "#fff",
    height: 42
  },
  error: {
    color: 'red',
    marginTop: 4,
  },
})

export default CustomInput