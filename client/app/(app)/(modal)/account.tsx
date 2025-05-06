import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import CustomModal from "../../components/CustomLeftModal";
import useStore from "../../state/store";
import { useRouter } from "expo-router";
import { useAppearanceStore, ThemeKey } from "../../state/appStore";

export default function AccountScreen() {
  const router = useRouter()
  const { user, updateUser } = useStore()
  const [name, setName] = useState(user?.name || "Имя");
  const [surname, setSurname] = useState(user?.surname || "Фамилия");
  const [nickname, setNickname] = useState(user?.nickname || "Nickname");
  const [bio, setBio] = useState(user?.description || "О себе...");
  const { getGradient } = useAppearanceStore()
  const activeColors = getGradient();

  const handleSave = async () => {
    const res = await updateUser(name, surname, nickname, bio)
    if (res) router.back()
  };

  return (
    <CustomModal title="Мой аккаунт">
      <LinearGradient colors={activeColors} style={{flex: 1}}>
        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
            <View style={styles.profileContainer}>
              <Text style={styles.label}>Имя</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} />

              <Text style={styles.label}>Фамилия</Text>
              <TextInput style={styles.input} value={surname} onChangeText={setSurname} />

              <Text style={styles.label}>Никнейм</Text>
              <TextInput style={styles.input} value={nickname} onChangeText={setNickname} />

              <Text style={styles.label}>О себе</Text>
              <TextInput style={[styles.input, styles.bioInput]} multiline value={bio} onChangeText={setBio} />

              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={[styles.saveButtonText, { color: activeColors[0] }]}>Сохранить</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
      </LinearGradient>
    </CustomModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  banner: {
    height: 120,
    borderRadius: 10,
    marginBottom: 20,
  },
  profileContainer: {
    padding: 15,
    borderRadius: 10,
  },
  label: {
    color: "#bbb",
    fontSize: 14,
    marginBottom: 5,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    color: "#fff",
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  bioInput: {
    height: 120,
    textAlignVertical: "top",
  },
  colorButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  colorButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  saveButton: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  saveButtonText: { color: "#445b73", fontWeight: "bold" },
});