import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Linking, Platform } from "react-native"
import CustomLeftModal from "../../components/CustomLeftModal"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import { useState, useEffect } from "react"
import useStore, { ISearchDto } from "../../state/store"
import useAppearanceStore from "../../state/appStore"
import UserListItem from "../../components/UserItem"
import { Image } from "expo-image"

export default function NotificationsScreen() {
  const [selectedTab, setSelectedTab] = useState("friends")
  const [users, setUsers] = useState<ISearchDto[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const { getFriends, getFriendRequests, acceptFriendRequest, rejectFriendRequest } = useStore()
  const { getGradient } = useAppearanceStore()
  const activeColors = getGradient()

  useEffect(() => {
    setUsers([])
    setHasMore(true)
    fetchUsers()
  }, [selectedTab])

  useEffect(() => {
    fetchUsers()
  }, [page])

  const openYoutube = (videoId: string) => {
    const url = Platform.select({
      ios: `vnd.youtube://watch?v=${videoId}`,
      android: `vnd.youtube://watch?v=${videoId}`,
      default: `https://www.youtube.com/watch?v=${videoId}`,
    });

    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Linking.openURL(`https://www.youtube.com/watch?v=${videoId}`);
      }
    });
  };

  const fetchUsers = async () => {
    if (!hasMore && page !== 1) return
  
    setLoading(true)
    try {
      let response: { hasMore: boolean, data: ISearchDto[] } = { hasMore: false, data: [] }
  
      switch (selectedTab) {
        case "friends":
          response = await getFriends(page)
          break
        case "requests":
          response = await getFriendRequests(page)
          break
      }
  
      setUsers(prev => (page === 1 ? response.data : [...prev, ...response.data]))
      setHasMore(response.hasMore)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (userId: string) => {
    console.log(userId)
    const success = await acceptFriendRequest(userId)
    if (success) {
      setUsers(users.filter(user => user._id !== userId))
    }
  }

  const handleReject = async (userId: string) => {
    console.log(userId)
    const success = await rejectFriendRequest(userId)
    if (success) {
      setUsers(users.filter(user => user._id !== userId))
    }
  }

  return (
    <CustomLeftModal title="Друзья">
      <LinearGradient colors={activeColors} style={styles.container}>
        <TouchableOpacity style={{ alignItems: "center" }} onPress={() => openYoutube('dQw4w9WgXcQ')}>
          <Image
            source={{ uri: "https://cdn.minecraftrating.ru/storage/servers/21897/2189740453586.gif" }}
            style={{width: "95%", height: 40, borderRadius: 5, marginBottom: 10}}
            placeholder={{ blurhash: "L1DY6Eo2A=,Y1^sUjtWp1]N[]9N^" }}
          />
        </TouchableOpacity>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === "friends" && styles.activeTab]}
            onPress={() => {
              setSelectedTab("friends")
              setPage(1)
            }}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "friends" && styles.activeTabText,
              ]}
            >
              Друзья
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === "requests" && styles.activeTab]}
            onPress={() => {
              setSelectedTab("requests")
              setPage(1)
            }}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "requests" && styles.activeTabText,
              ]}
            >
              Запросы
            </Text>
          </TouchableOpacity>
        </View>
        
        {loading ? ( 
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        ) : (
          <FlatList
            data={users}
            renderItem={({ item }) => (
              <UserListItem
                item={item}
                handleAccept={handleAccept}
                handleReject={handleReject}
              />
            )}
            keyExtractor={(item) => item._id.toString()}
            onEndReached={() => {
              if (hasMore && !loading) {
                setPage(prev => prev + 1)
              }
            }}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', marginTop: 50 }}>
                {selectedTab === "friends" && (
                  <>
                    <Ionicons name="people-outline" size={50} color="#fff" style={{ marginBottom: 10 }} />
                    <Text style={{ color: '#fff', fontSize: 16 }}>У вас пока нет друзей, ну в приложении пока нет, надеюсь вы поняли это сразу</Text>
                  </>
                )}
                {selectedTab === "requests" && (
                  <>
                    <Ionicons name="person-add-outline" size={50} color="#fff" style={{ marginBottom: 10 }} />
                    <Text style={{ color: '#fff', fontSize: 16 }}>Заявок пока нет</Text>
                  </>
                )}
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
  icon: {
    marginRight: 5,
  },
  input: {
    flex: 1,
    color: "#fff",
    paddingVertical: 10,
  },
  text: { fontSize: 18, fontWeight: "bold" },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 10,
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#fff",
  },
  tabText: {
    color: "#bbb",
    fontSize: 16,
  },
  activeTabText: {
    color: "#fff",
    fontWeight: "bold",
  }
})