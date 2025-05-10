import { Text, StyleSheet, View, TouchableOpacity, Modal, ActivityIndicator, Platform, Alert } from "react-native"
import { Stack, useRouter } from "expo-router"
import Feather from "@expo/vector-icons/Feather"
import CustomHeader from "../../components/CustomHeader"
import { LinearGradient } from "expo-linear-gradient"
import NotFound from "assets/not-found"
import useStore from "@/state/store"
import { useState } from "react"
import useAppearanceStore from "../../state/appStore"
import { Image } from "expo-image"

export default function MenuScreen() {
    const { user, logout } = useStore() 
    const router = useRouter()
    const [isLogoutModalVisible, setLogoutModalVisible] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const { getGradient } = useAppearanceStore()
    const activeColors = getGradient()

    const handleLogout = () => {
        if (Platform.OS === 'ios') {
            Alert.alert('Подтверждение выхода', 'Вы уверены, что хотите выйти?', [
                {
                  text: 'Отмена',
                  style: 'cancel',
                },
                {text: 'OK', onPress: confirmLogout, style: 'destructive'},
            ])
        } else {
            setLogoutModalVisible(true)
        }
    }

    const confirmLogout = async () => {
        try {
            setIsLoading(true)
            const res = await logout()
            if (res) {
                router.replace('/(auth)')
                setLogoutModalVisible(false) 
            }
        } catch (err) {
            setLogoutModalVisible(false) 
        } finally {
            setIsLoading(false)
        }
    }

    const cancelLogout = () => {
        setLogoutModalVisible(false)
    }

    return (
        <LinearGradient colors={activeColors} style={styles.container}>
            <Stack.Screen options={{ header: () => <CustomHeader title="Дополнительные" /> }} />
            <View style={styles.profileContainer}>
                <TouchableOpacity onPress={() => router.push(`/profile/${user?.id}`)}>
                    {user && user.avatar ? (
                        <View style={styles.imageContainer}>
                            <Image 
                                source={{ uri: user.avatar }} 
                                style={styles.avatarImage} 
                                placeholder={ user.avatar.startsWith('http') ? { blurhash: new URL(user.avatar).search.slice(1) } : undefined}
                            />
                        </View>
                    ) : <NotFound />}
                </TouchableOpacity>
                <Text style={styles.profileName}>{user?.name} {user?.surname}</Text>
            </View>

            <TouchableOpacity style={styles.button} onPress={() => router.push("/friends")}>
                <Feather name="users" size={24} color="#fff" />
                <Text style={styles.buttonText}>Друзья</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={() => router.push("/account")}>
                <Feather name="user" size={24} color="#fff" />
                <Text style={styles.buttonText}>Мой аккаунт</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={() => router.push("/appearance")}>
                <Feather name="image" size={24} color="#fff" />
                <Text style={styles.buttonText}>Внешний вид</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={() => router.push("/app-settings")}>
                <Feather name="settings" size={24} color="#fff" />
                <Text style={styles.buttonText}>Приложение</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={() => router.push("/privacy")}>
                <Feather name="lock" size={24} color="#fff" />
                <Text style={styles.buttonText}>Приватность</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity onPress={handleLogout}>
                <Text style={styles.logoutText}>Выйти</Text>
            </TouchableOpacity>

            <Modal
                statusBarTranslucent
                visible={isLogoutModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={cancelLogout} 
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: activeColors[0] }]}>
                        <Text style={styles.modalTitle}>Подтверждение выхода</Text>
                        <Text style={styles.modalMessage}>Вы уверены, что хотите выйти?</Text>
                        <View style={styles.modalButtonsContainer}>
                            <TouchableOpacity style={styles.modalButton} onPress={cancelLogout}>
                                <Text style={styles.modalButtonText}>Нет</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonDanger]}
                                onPress={confirmLogout}
                            >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.modalButtonText}>Выйти</Text>
                            )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </LinearGradient>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: "#fff" },
    profileContainer: { alignItems: "center", marginBottom: 20 },
    profileName: { fontSize: 18, fontWeight: "bold", marginTop: 5, color: "#fff", textAlign: "center" },
    button: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
    buttonText: { marginLeft: 10, fontSize: 16, color: "#fff" },
    divider: { height: 1, backgroundColor: "#ddd", marginVertical: 20 },
    logoutText: { color: "#cc0033", fontSize: 16, fontWeight: "bold" },
    avatarImage: {
        width: "100%",
        height: "100%",
        borderRadius: 50,
    },
    imageContainer: {
        position: 'relative',
        width: 100,
        height: 100,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '80%',
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
        elevation: 5, 
    },
    modalTitle: {
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 10,
    },
    modalMessage: {
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
        color: 'white',
    },
      modalButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
      },
      modalButton: {
        flex: 1,
        paddingVertical: 12,
        marginHorizontal: 5,
        borderRadius: 5,
        backgroundColor: '#007AFF', 
        justifyContent: 'center',
        alignItems: 'center',
      },
      modalButtonText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
      },
      modalButtonDanger: {
        backgroundColor: '#FF3B30', 
      },
})