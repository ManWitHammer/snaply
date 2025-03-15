import { Stack, useRouter } from "expo-router";
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import NotFound from "../../../assets/not-found";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import useStore from "../../state/store"
import InApiError from "../../components/InApiError";

export default function ProfileScreen() {
  const { setAvatar, user } = useStore()
  const [image, setImage] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Для выбора изображения необходимо предоставить доступ к галерее.");
      return;
    }
  
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
  
    if (!result.canceled) {
      try {
        setUploading(true);
  
        const formData = new FormData();
        formData.append('avatar', {
          uri: result.assets[0].uri,
          name: result.assets[0].fileName, 
          type: result.assets[0].mimeType,
        } as any);
  
        const success = await setAvatar(formData)
  
        if (success) {
          alert("Аватар успешно обновлен!");
          setImage(result.assets[0].uri); 
        } else {
          alert("Не удалось обновить аватар.");
        }
      } catch (error) {
        console.error("Ошибка при загрузке аватара:", error);
        alert("Произошла ошибка при загрузке аватара.");
      } finally {
        setUploading(false);
      }
    }
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          header: () => <View style={{ height: 20}} />,
          presentation: "modal",
        }}
      />
      <InApiError/>

      <View style={styles.profileContainer}>
        <View style={styles.banner}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarPlaceholder}>
            {image ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: image }} style={styles.avatarImage} />
                {uploading && (
                  <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#0000ff" />
                  </View>
                )}
              </View>
            ) : user && user.avatar ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
                {uploading && (
                  <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#0000ff" />
                  </View>
                )}
              </View>
            ): <NotFound />}
          </TouchableOpacity>
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.name} {user?.surname}</Text>
          <Text style={styles.profileDesc}>Добавить информацию о себе</Text>
          <TouchableOpacity style={styles.publishButton}>
            <Text style={styles.publishText}>Опубликовать</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.friendsContainer}>
          <Ionicons name="people-outline" size={40} color="#fff" />
          <View style={styles.noFriends}>
            <Text style={styles.friendsText}>Вы пока не добавили друзей</Text>
            <TouchableOpacity>
              <Text style={styles.addFriends}>Добавить друзей</Text>
            </TouchableOpacity>
          </View>
        </View> 
      </View>

      <View style={styles.mediaContainer}>
        <View style={styles.mediaTabs}>
          <TouchableOpacity style={styles.mediaTab}>
            <Ionicons name="image-outline" size={18} color="#fff" />
            <Text style={styles.mediaText}>Фото</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mediaTab}>
            <Ionicons name="document-text-outline" size={18} color="#fff" />
            <Text style={styles.mediaText}>Посты</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.noPhotosText}>Вы ещё не загрузили ни одно фото</Text>
        <TouchableOpacity style={styles.uploadButton}>
          <Text style={styles.uploadText}>Загрузить фото</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#445b73" },
  profileContainer: { alignItems: "center", },
  banner: {
    position: "relative",
    width: "100%",
    height: 155,
    backgroundColor: "#445b73",
    borderRadius: 10,
  },
  avatarPlaceholder: {
    zIndex: 1,
    position: "absolute",
    bottom: -50,
    left: Dimensions.get("window").width / 2 - 50,
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 50, 
    overflow: "hidden", 
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#749bb8"
  },
  profileInfo: { 
    backgroundColor: "#749bb8", 
    width: "100%", 
    padding: 20, 
    borderRadius: 10, 
    alignItems: "center",
    paddingTop: 45,
    marginBottom: 10
  },
  profileName: { color: "#fff", fontSize: 22, fontWeight: "bold", marginTop: 10 },
  profileDesc: { color: "#ccc", fontSize: 14, marginTop: 5 },
  publishButton: {
    marginTop: 10,
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  publishText: { color: "#445b73", fontWeight: "bold" },
  friendsContainer: {
    width: "100%",
    backgroundColor: "#749bb8",
    padding: 10,
    height: 70,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  friendsText: { color: "#fff", flex: 1, fontSize: 18 },
  addFriends: { color: "#87ceeb", fontSize: 14 },
  mediaContainer: { alignItems: "center", backgroundColor: "#749bb8", marginTop: 10, borderRadius: 10, padding: 15 },
  mediaTabs: { flexDirection: "row", justifyContent: "space-around", width: "100%", marginBottom: 10 },
  mediaTab: { flexDirection: "row", alignItems: "center", gap: 5, justifyContent: "center" },
  mediaText: { color: "#fff", fontSize: 16 },
  noPhotosText: { color: "#ccc", marginBottom: 10, marginTop: 20 },
  uploadButton: { backgroundColor: "#fff", padding: 10, borderRadius: 10 },
  uploadText: { color: "#445b73", fontWeight: "bold" },
  imageContainer: {
    position: 'relative', 
    width: 100, 
    height: 100, 
  },
  loaderContainer: {
    position: 'absolute', 
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)', 
    borderRadius: 50, 
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#000',
  },
  noFriends: {
    flexDirection: 'column'
  }
});