import { Link, useRouter } from "expo-router"
import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Keyboard,
  Animated,
  Easing
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import CustomInput from "@/components/CustomInput"
import useStore from "../state/store"
import useAppearanceStore from '../state/appStore'

export default function LoginScreen() {
  const { user, setField, login, setIsAuth } = useStore()
  const [passwordVisible, setPasswordVisible] = useState(false)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [keyboardHeight] = useState(new Animated.Value(0))
  const { getGradient } = useAppearanceStore()
  const activeColors = getGradient()

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        Animated.timing(keyboardHeight, {
          toValue: e.endCoordinates.height,
          duration: 250,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }).start()
      }
    )

    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        Animated.timing(keyboardHeight, {
          toValue: 0,
          duration: 250,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }).start()
      }
    )

    return () => {
      showSubscription.remove()
      hideSubscription.remove()
    }
  }, [])

  const handlePress = async () => {
    Keyboard.dismiss()
    setIsLoading(true)
    try {
      const res = await login()
      if (res == 200) {
        router.replace('/(app)')
        setIsAuth(true)
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
    <LinearGradient colors={activeColors} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
        enabled={Platform.OS === "ios"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        >
          <Animated.View 
            style={[
              styles.contentWrapper,
              { paddingBottom: keyboardHeight }
            ]}
          >
            <View style={styles.mainContent}>
              <Text style={styles.title}>Вход</Text>
              
              <CustomInput
                icon="person-outline"
                value={user?.nickname || ""}
                placeholder="Имя пользователя"
                onChangeText={(text) => setField("nickname", text)}
              />

              <CustomInput
                icon="lock-closed-outline"
                value={user?.password || ""}
                placeholder="Пароль"
                secureTextEntry={!passwordVisible}
                onToggleSecure={() => setPasswordVisible(!passwordVisible)}
                onChangeText={(text) => setField("password", text)}
              />
              
              <TouchableOpacity 
                onPress={handlePress} 
                disabled={isLoading} 
                style={styles.button}
              >
                {isLoading ? (
                  <ActivityIndicator color={activeColors[0]} />
                ) : (
                  <Text style={[styles.buttonText, { color: activeColors[0] }]}>Войти</Text>
                )}
              </TouchableOpacity>
            </View>
            
            <View style={styles.bottomLinkContainer}>
              <Text style={styles.linkText}>
                Нет аккаунта? <Link href="/register" style={styles.link} replace>Зарегистрироваться</Link>
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: Dimensions.get('window').height,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'space-between',
  },
  mainContent: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
    alignItems: "center",
    width: "100%",
  },
  bottomLinkContainer: {
    width: '100%',
    padding: 20,
    paddingBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
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
    color: "#fff",
  },
  link: {
    color: "#ffcccb",
    fontWeight: "bold",
    textDecorationLine: "underline",
  }
})