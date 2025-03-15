import { useRouter } from "expo-router";
import { View, Text, StyleSheet, Pressable, Dimensions, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient"

export default function AuthChoiceScreen() {
    const router = useRouter();
    return (
        <LinearGradient colors={["#445b73", "#749bb8"]} style={styles.container}>
            <View style={styles.content}>
                <View></View>
                <View style={{alignItems: "center"}}>
                  <Image source={require("../../assets/icon.png")} style={{width: 100, height: 100, marginBottom: 20}}/>
                  <Text style={styles.title}>Добро пожаловать</Text>
                  <Text style={styles.subtitle}>в snaply!</Text>
                </View>
                <View>
                  <Pressable onPress={() => router.push("/login")} style={styles.buttonContainer}>
                      <LinearGradient
                          colors={["#EC6F66", "#F3A183"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.button}
                      >
                          <Text style={styles.buttonText}>Войти</Text>
                      </LinearGradient>
                  </Pressable>

                  <Pressable onPress={() => router.push("/register")} style={styles.buttonContainer}>
                      <LinearGradient
                          colors={["#EC6F66", "#F3A183"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.button}
                      >
                          <Text style={styles.buttonText}>Зарегистрироваться</Text>
                      </LinearGradient>
                  </Pressable>
                </View>

            </View>
        </LinearGradient>
  );
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
  buttonContainer: {
    width: Dimensions.get("screen").width * 0.9 - 40,
    marginBottom: 20, // Отступ между кнопками
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
});