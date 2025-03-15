import { useRouter, Link } from "expo-router"
import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  Pressable
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import CustomInput from "../components/CustomInput"
import useStore from "@/state/store"
import InApiError from "../components/InApiError"
import { isAuthenticatedAtom } from '../state/auth'
import { useAtom } from "jotai"

export default function RegisterScreen() {
  const router = useRouter()
  const { user, errors, setField, validateField, registration } = useStore()
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [, setIsAuthenticated] = useAtom(isAuthenticatedAtom)

  const handleRegistration = async() => {
    setIsLoading(true)
    try {
      const res = await registration()
      if (res) {
        setIsAuthenticated(true)
        router.replace('/(app)')
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
    >
      <LinearGradient colors={["#445b73", "#749bb8"]} style={styles.container}>
        <InApiError/> 
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Регистрация</Text>
          <View style={{ flex: 1, width: "90%", alignItems: "center" }}>
            <View style={styles.row}>
              <CustomInput
                icon="person-outline"
                value={user && user.name ? user.name : ""}
                placeholder="Имя"
                error={errors.name}
                onChangeText={(text) => {
                  setField("name", text)
                  validateField("name", text)
                }}
                halfInput
              />
              <CustomInput
                icon="person-outline"
                value={user && user.surname ? user.surname : ""}
                placeholder="Фамилия"
                error={errors.surname}
                onChangeText={(text) => {
                  setField("surname", text)
                  validateField("surname", text)
                }}
                halfInput
              />
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

            <Pressable onPress={handleRegistration} disabled={isLoading} style={{...styles.button, padding: 0}}>
              <LinearGradient
                colors={["#EC6F66", "#F3A183"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              > 
                {isLoading ? (
                  <>
                    <ActivityIndicator color='#fff' />
                  </>
                ) : (
                  <Text style={styles.buttonText}>Зарегистрироваться</Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>

        <Text style={styles.linkText}>Есть аккаунт? <Link href="/login" style={styles.link}>Авторизоваться</Link></Text>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingTop: 40,
    alignItems: "center",
  },
  scrollContainer: {
    padding: 20,
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
    width: Dimensions.get("window").width * 0.9 - 35,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  button: {
    padding: 15,
    borderRadius: 12,
    width: Dimensions.get("window").width * 0.9 - 40,
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