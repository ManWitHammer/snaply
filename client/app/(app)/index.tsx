import { Stack } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import CustomHeader from "../components/CustomHeader";

export default function HomeScreen() {
  return (
    <LinearGradient colors={["#445b73", "#749bb8"]} style={styles.container}>
      <Stack.Screen options={{
        header: () => <CustomHeader title="Главная"/>
      }} />

      <View style={styles.storiesContainer}>
        <View style={styles.story}>
          <Ionicons name="add-circle" size={50} color="#fff" />
          <Text style={styles.storyText}>История</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  storiesContainer: { flexDirection: "row", gap: 10, marginBottom: 20 },
  story: { alignItems: "center" },
  storyText: { color: "#fff", fontSize: 12, marginTop: 5 },
});