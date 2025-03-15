import { Text, StyleSheet } from "react-native"
import { Stack } from "expo-router"
import CustomHeader from "../components/CustomHeader"
import { LinearGradient } from "expo-linear-gradient";

export default function MenuScreen() {
    return (
        <LinearGradient colors={["#445b73", "#749bb8"]} style={styles.container}>
            <Stack.Screen options={{ header: () => <CustomHeader title="Дополнительные" /> }} />
            <Text style={styles.text}>Меню</Text>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 20, fontWeight: "bold", color: "white" },
});