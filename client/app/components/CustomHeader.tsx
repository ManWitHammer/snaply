import { View, TouchableOpacity, StyleSheet, Text, Dimensions, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import useStore from "../state/store";
import { Avatar } from "react-native-elements";

interface CustomHeaderProps {
  showBack?: boolean;
  title?: string;
}

const CustomHeader = ({ showBack = false, title }: CustomHeaderProps) => {
  const { user } = useStore();
  const router = useRouter()
  const screenWidth = Dimensions.get("window").width;

  return (
    <View style={styles.headerContainer}>
      {showBack ? (
        <TouchableOpacity onPress={() => router.back()} style={styles.button}>
          <Ionicons name="arrow-back" size={30} color="#fff" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={() => router.replace("/profile/213")} style={styles.button}>
          {user && user.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
          <Ionicons name="person-circle-outline" size={30} color="#fff" />
          )}
        </TouchableOpacity>
      )}

      {title && <Text style={styles.headerTitle}>{title}</Text>}

      <View style={[styles.bottomLine, { width: screenWidth * 0.9 }]} />
    </View>
  );
};

export default CustomHeader;

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#445b73",
    paddingTop: 40,
    paddingBottom: 10,
    paddingHorizontal: 15,
  },
  button: {
    padding: 10,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    flex: 1,
  },
  bottomLine: {
    height: 2,
    backgroundColor: "#fff",
    position: "absolute",
    bottom: 5,
    left: "5%",
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  }
});