import { Link, useRouter } from "expo-router"
import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import CustomInput from "@/components/CustomInput"
import useStore from "../state/store"
import { useAppearanceStore } from '../state/appStore';

export default function LoginScreen() {
  const { user, setField, login } = useStore()
  const [passwordVisible, setPasswordVisible] = useState(false)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const { getGradient } = useAppearanceStore()
  const activeColors = getGradient()

  const handlePress = async () => {
    setIsLoading(true)
    try {
      const res = await login()
      if (res == 200) {
		    router.replace('/(app)')
      } else if (res == 403) {
        router.replace('/not-activate')
      }
    } catch (err) {
      console.log(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, width: "100%" }}
    >
      <LinearGradient colors={activeColors} style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
            <Text style={styles.title}>Вход</Text>
            <View style={{ flex: 1, width: "90%", alignItems: "center" }}>
                <CustomInput
                    icon="person-outline"
                    value={user && user.nickname ? user.nickname : ""}
                    placeholder="Имя пользователя"
                    onChangeText={(text) => {
                        setField("nickname", text)
                    }}
                />

                <CustomInput
                    icon="lock-closed-outline"
                    value={user && user.password ? user.password : ""}
                    placeholder="Пароль"
                    secureTextEntry={!passwordVisible}
                    onToggleSecure={() => setPasswordVisible(!passwordVisible)}
                    onChangeText={(text) => {
                        setField("password", text)
                    }}
                />
                <TouchableOpacity onPress={handlePress} disabled={isLoading} style={styles.button}>
                  {isLoading ? (
                    <ActivityIndicator color='#445b73' />
                  ) : (
                    <Text style={[styles.buttonText, { color: activeColors[0] }]}>Войти</Text>
                  )}
                </TouchableOpacity>
            </View>
              <Text style={styles.linkText}>Нет аккаунта? <Link href="/register" style={styles.link}>Зарегистрироваться</Link></Text>
            </ScrollView>
        </LinearGradient>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    paddingTop: 40,
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
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    width: "90%",
  },
  input: {
    flex: 1,
    marginLeft: 10,
    color: "#fff",
  },
  forgotPassword: {
    color: "#ffcccb",
    textAlign: "right",
    marginBottom: 20,
  },
  button: {
    padding: 15,
    borderRadius: 25,
    backgroundColor: 'white',
    width: Dimensions.get("screen").width * 0.9 - 40,
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
  }
})