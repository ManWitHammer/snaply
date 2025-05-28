import { useRouter, Link } from "expo-router"
import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  Keyboard
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import CustomInput from "../components/CustomInput"
import useStore from "../state/store"
import useAppearanceStore from "../state/appStore"
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated'
import { useSafeAreaInsets } from "react-native-safe-area-context"

export default function RegisterScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user, errors, setField, validateField, registration } = useStore()
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { getGradient } = useAppearanceStore()
  const activeColors = getGradient()
  const [keyboardVisible, setKeyboardVisible] = useState(false)

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true))
    const hideSub = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false))
  
    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [])

  const handleRegistration = async() => {
    setIsLoading(true)
    try {
      const res = await registration()
      if (res) {
        router.replace('/not-activate')
      }
    } catch(err) {
      console.log(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, width: "100%" }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
      enabled={keyboardVisible}
    >
      <LinearGradient colors={activeColors} style={[styles.container, { paddingTop: insets.top + 10 }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Регистрация</Text>
          <View style={{ flex: 1, width: "90%"}}>
            <View style={styles.row}>
              <CustomInput
                icon="person-outline"
                value={user && user.name ? user.name : ""}
                placeholder="Имя"
                onChangeText={(text) => {
                  setField("name", text)
                  validateField("nameAndSurname", text)
                }}
                halfInput
              />
              <CustomInput
                icon="person-outline"
                value={user && user.surname ? user.surname : ""}
                placeholder="Фамилия"
                onChangeText={(text) => {
                  setField("surname", text)
                  validateField("nameAndSurname", text)
                }}
                halfInput
              />
            </View>

            <View style={{ alignItems: "flex-start", width: "100%", marginBottom: 6 }}>
              {errors.nameAndSurname && (
                <Animated.Text 
                  entering={FadeInDown} 
                  exiting={FadeOutDown}  
                  style={styles.error}
                >
                  {errors.nameAndSurname}
                </Animated.Text>
              )}
            </View>
            
            <CustomInput
              icon="person-outline"
              value={user && user.nickname ? user.nickname : ""}
              placeholder="Имя пользователя"
              error={errors.nickname}
              onChangeText={(text) => {
                setField("nickname", text)
                validateField("nickname", text)
              }}
            />
            <CustomInput
              icon="mail-outline"
              value={user && user.email ? user.email : ""}
              placeholder="E-mail"
              error={errors.email}
              keyboardType="email-address"
              onChangeText={(text) => {
                setField("email", text)
                validateField("email", text)
              }}
            />
            <CustomInput
              icon="lock-closed-outline"
              value={user && user.password ? user.password : ""}
              placeholder="Пароль"
              error={errors.password}
              secureTextEntry={!passwordVisible}
              onToggleSecure={() => setPasswordVisible(!passwordVisible)}
              onChangeText={(text) => {
                setField("password", text)
                validateField("password", text)
              }}
            />

            <TouchableOpacity onPress={handleRegistration} disabled={isLoading} style={styles.button}>
              {isLoading ? (
                <ActivityIndicator color='#445b73' />
              ) : (
                <Text style={[styles.buttonText, { color: activeColors[0] }]}>Зарегистрироваться</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={[styles.linkText, { paddingBottom: insets.bottom + 10 }]}>
            Есть аккаунт? <Link href="/login" style={[styles.link, { color: activeColors[0] }]} replace>Авторизоваться</Link>
          </Text>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
  },
  row: {
    width: Dimensions.get("window").width * 0.9,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    padding: 15,
    borderRadius: 25,
    backgroundColor: 'white',
    width: Dimensions.get("screen").width * 0.9,
    alignItems: "center",
  },
  buttonText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  linkText: {
    textAlign: "center",
    marginTop: 20,
    color: "#fff",
  },
  link: {
    color: "#ffcccb",
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  error: {
    color: 'red',
    textAlign: 'left'
  }
})