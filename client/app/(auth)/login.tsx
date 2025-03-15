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
  Pressable,
  Dimensions
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import CustomInput from "@/components/CustomInput"
import useStore from "@/state/store"
import InApiError from "@/components/InApiError"
import { isAuthenticatedAtom } from '../state/auth'
import { useAtom } from "jotai"

export default function LoginScreen() {
  const { user, setField, login } = useStore()
  const [passwordVisible, setPasswordVisible] = useState(false)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [, setIsAuthenticated] = useAtom(isAuthenticatedAtom)

  const handlePress = async () => {
        setIsLoading(true)
        try {
            const res = await login()
            if (res) {
              setIsAuthenticated(true)
		          router.replace('/(app)')
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
        <LinearGradient colors={["#445b73", "#749bb8"]} style={styles.container}>
            <InApiError/>
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
                <Pressable onPress={handlePress} disabled={isLoading} style={{width: Dimensions.get("screen").width * 0.9 - 40 }}>
                   <LinearGradient
                    colors={["#EC6F66", "#F3A183"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.button}
                  > 
                    {isLoading ? (
                      <ActivityIndicator color='#fff' />
                    ) : (
                      <Text style={styles.buttonText}>Войти</Text>
                    )}
                  </LinearGradient>
                </Pressable>
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
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
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