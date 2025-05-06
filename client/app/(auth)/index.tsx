import { useRouter } from "expo-router"
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useAppearanceStore } from "../state/appStore"

export default function AuthChoiceScreen() {
    const router = useRouter()
    const { getGradient } = useAppearanceStore()
    const activeColors = getGradient()

    return (
        <LinearGradient colors={activeColors} style={styles.container}>
            <View style={styles.content}>
                <View></View>
                <View style={{alignItems: "center"}}>
                  <Image source={require("../../assets/icon.png")} style={{width: 150, height: 150, marginBottom: 20}}/>
                  <Text style={styles.title}>Добро пожаловать</Text>
                  <Text style={styles.subtitle}>в snaply!</Text>
                </View>
                <View>
                  <TouchableOpacity onPress={() => router.push("/login")} style={styles.button}>
                    <Text style={[styles.buttonText, { color: activeColors[0] }]}>Войти</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => router.push("/register")} style={styles.button}>
                    <Text style={[styles.buttonText, { color: activeColors[0] }]}>Зарегистрироваться</Text>
                  </TouchableOpacity>
                </View>

            </View>
        </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  content: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    textAlign: "center",
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  subtitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 40,
    textAlign: "center",
  },
  button: {
    marginBottom: 20,
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
})