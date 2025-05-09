import { View, Text, StyleSheet, FlatList, ActivityIndicator } from "react-native"
import CustomLeftModal from "../../../components/CustomLeftModal"
import { LinearGradient } from "expo-linear-gradient"
import { useLocalSearchParams } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useState, useEffect } from "react"
import useStore from "../../../state/store"
import useAppearanceStore from "../../../state/appStore"
import UserListItem from "../../../components/UserItem"

export default function FriendsModal() {
    const { getGradient } = useAppearanceStore()
    const activeColors = getGradient()
    const { fetchUserFriends, user, setErrorMessage } = useStore()
    const [loading, setLoading] = useState(true)
    const [friends, setFriends] = useState<any[]>([])
    const [page, setPage] = useState(1)
    const { id } = useLocalSearchParams()

    useEffect(() => {
        const fetchFriends = async () => {
            try {
                const res = await fetchUserFriends(id as string, page)
                setFriends(prev => [...prev, ...res])
                setLoading(false)
            } catch (error) {
                setErrorMessage("что то пошло не так:(")
            }
        }
        fetchFriends()
    }, [])

    return (
        <CustomLeftModal title="Друзья" >
            <LinearGradient colors={activeColors} style={styles.container}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={activeColors[0]} />
                    </View>
                ) : (
                    <FlatList
                        data={friends}
                        keyExtractor={(item) => item._id}
                        renderItem={({ item }) => (
                            <UserListItem
                                item={item}
                            />
                        )}
                        onEndReached={() => {
                            setPage(prev => prev + 1)
                        }}
                        onEndReachedThreshold={0.5}
                        ListEmptyComponent={
                            <View style={{ alignItems: 'center', marginTop: 50 }}>
                                <Ionicons name="people-outline" size={50} color="#fff" style={{ marginBottom: 10 }} />
                                <Text style={{ color: '#fff', fontSize: 16 }}>У {user && user.id == id ? "вас" : "у этого пользователя"} пока нет друзей, ну в приложении пока нет, надеюсь вы поняли это сразу</Text>      
                            </View>
                        }
                    />
                )}
            </LinearGradient>
        </CustomLeftModal>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#1e1e1e",
        paddingTop: 15,
        paddingHorizontal: 5
    },
    loadingContainer: { 
        flex: 1, 
        justifyContent: "center", 
        alignItems: "center" 
    }
})