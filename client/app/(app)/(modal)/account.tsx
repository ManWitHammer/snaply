import { useState } from "react"
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import CustomModal from "../../components/CustomLeftModal"
import useStore from "../../state/store"
import { useRouter } from "expo-router"
import useAppearanceStore from "../../state/appStore"

export default function AccountScreen() {
  const router = useRouter()
  const { user, updateUser } = useStore()
  const [name, setName] = useState(user?.name || "Имя")
  const [surname, setSurname] = useState(user?.surname || "Фамилия")
  const [nickname, setNickname] = useState(user?.nickname || "Nickname")
  const [bio, setBio] = useState(user?.description || "О себе...")
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{
    nickname?: string
    nameAndSurname?: string
  }>({})
  const { getGradient } = useAppearanceStore()
  const activeColors = getGradient()

  const validateField = (field: string, value?: string) => {
    const newErrors = { ...errors }

    switch (field) {
      case 'nickname':
        if (!value) {
          newErrors.nickname = 'Нужен Никнейм'
        } else if (value.length < 2) {
          newErrors.nickname = 'Никнейм должен состоять из минимум 2 символов'
        } else if (value.length > 24) {
          newErrors.nickname = 'Никнейм должен состоять из максимум 24 символов'
        } else if (!/^[a-zA-Z0-9._-]+$/.test(value)) {
          newErrors.nickname = 'Никнейм может содержать только латинские буквы, цифры, точку, подчеркивание и дефис'
        } else {
          delete newErrors.nickname
        }
        break

      case 'nameAndSurname':
        const trimmedName = name.trim()
        const trimmedSurname = surname.trim()

        if (!trimmedName || !trimmedSurname) {
          newErrors.nameAndSurname = 'Нужны имя и фамилия'
        } else if (trimmedName.length < 2 || trimmedSurname.length < 2) {
          newErrors.nameAndSurname = 'Имя и фамилия должны быть минимум по 2 символа'
        } else if (trimmedName.length > 32 || trimmedSurname.length > 24) {
          newErrors.nameAndSurname = 'Имя и фамилия должны быть максимум по 24 символа'
        } else {
          delete newErrors.nameAndSurname
        }
        break

      default:
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    const isNicknameValid = validateField('nickname', nickname)
    const isNameAndSurnameValid = validateField('nameAndSurname')

    if (isNicknameValid && isNameAndSurnameValid) {
      setLoading(true)
      try {
        await updateUser(name, surname, nickname, bio.slice(0, 500))
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <CustomModal title="Мой аккаунт">
      <LinearGradient colors={activeColors} style={{flex: 1}}>
        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
            <View style={styles.profileContainer}>
              <Text style={styles.label}>Имя</Text>
              <TextInput 
                style={styles.input} 
                value={name} 
                onChangeText={(text) => {
                  setName(text)
                  validateField('nameAndSurname')
                }} 
              />
              {errors.nameAndSurname && <Text style={styles.errorText}>{errors.nameAndSurname}</Text>}

              <Text style={styles.label}>Фамилия</Text>
              <TextInput 
                style={styles.input} 
                value={surname} 
                onChangeText={(text) => {
                  setSurname(text)
                  validateField('nameAndSurname')
                }} 
              />

              <Text style={styles.label}>Никнейм</Text>
              <TextInput 
                style={styles.input} 
                value={nickname} 
                onChangeText={(text) => {
                  setNickname(text)
                  validateField('nickname', text)
                }} 
              />
              {errors.nickname && <Text style={styles.errorText}>{errors.nickname}</Text>}

              <Text style={styles.label}>О себе</Text>
              <TextInput 
                style={[styles.input, styles.bioInput]} 
                multiline 
                value={bio} 
                onChangeText={setBio}
                maxLength={500} 
              />
              <Text style={styles.charCount}>{bio.length}/500</Text>



              <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color={activeColors[0]} />
                ) : (
                  <Text style={[styles.saveButtonText, { color: activeColors[0] }]}>Сохранить</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
      </LinearGradient>
    </CustomModal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  banner: {
    height: 120,
    borderRadius: 10,
    marginBottom: 20,
  },
  profileContainer: {
    padding: 15,
    borderRadius: 10,
  },
  label: {
    color: "#bbb",
    fontSize: 14,
    marginBottom: 5,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    color: "#fff",
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  bioInput: {
    height: 120,
    textAlignVertical: "top",
  },
  colorButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  colorButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  saveButton: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  saveButtonText: { 
    color: "#445b73", 
    fontWeight: "bold" 
  },
  errorText: {
    color: "#ff4444",
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
  },
  charCount: {
    color: "#bbb",
    fontSize: 12,
    textAlign: "right",
    marginTop: -10,
    marginBottom: 10,
  }
})