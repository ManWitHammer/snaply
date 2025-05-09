import { useState, useEffect } from "react"
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import CustomLeftModal from "../../../components/CustomLeftModal"
import { LinearGradient } from "expo-linear-gradient"
import useStore, { ISearchDto } from "../../../state/store"
import usePostsStore, { Post } from "../../../state/postsStore"
import { useLocalSearchParams } from "expo-router"
import useAppearanceStore from "../../../state/appStore"
import PostItem from "../../../components/PostItem"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import UserListItem from "../../../components/UserItem"

const SearchScreen = () => {
  const { prompt } = useLocalSearchParams()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTab, setSelectedTab] = useState("users")
  const { searchPosts, likePost, deletePost } = usePostsStore()
  const { search, user } = useStore()
  const [searchResults, setSearchResults] = useState<ISearchDto[]>([])
  const [postResults, setPostResults] = useState<Post[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loadingPosts, setLoadingPosts] = useState(false)
  const { getGradient } = useAppearanceStore()
  const activeColors = getGradient()
  const [loadingSearch, setLoadingSearch] = useState(false)
  let searchTimeout: NodeJS.Timeout

  useEffect(() => {
    if (prompt !== "secret") {
      setSelectedTab("posts")
      handleSearch(prompt as string)
    }
  }, [])

  const handleSearch = (text: string) => {
    setSearchQuery(text)
    clearTimeout(searchTimeout)
  
    if (text.trim() === "") {
      setSearchResults([])
      setPostResults([])
      return
    }
    setLoadingSearch(true)
    searchTimeout = setTimeout(async () => {
      if (selectedTab === "users") {
        const results = await search(text)
        setSearchResults(results)
      } else {
        setCurrentPage(1)
        await loadPosts(text, 1)
      }
      setLoadingSearch(false)
    }, 500)
  }

  const handleLike = (postId: string) => {
    if (!user?.id) return
    likePost(postId, user.id)
  }

  const loadPosts = async (query: string, page: number) => {
    setLoadingPosts(true)
    try {
      const result = await searchPosts(query, page)
      setPostResults(page === 1 ? result.posts : [...postResults, ...result.posts])
      setTotalPages(result.totalPages)
      setCurrentPage(page)
    } finally {
      setLoadingPosts(false)
    }
  }

  const loadMorePosts = () => {
    if (currentPage < totalPages && !loadingPosts) {
      loadPosts(searchQuery, currentPage + 1)
    }
  }

  useEffect(() => {
    if (searchQuery.trim() !== "" && selectedTab === "posts") {
      loadPosts(searchQuery, 1)
    }
  }, [selectedTab])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <CustomLeftModal title="Поиск" bottomSheetEnable>
        <LinearGradient colors={activeColors} style={styles.container}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#fff" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder={selectedTab === "users" ? "Пользователи" : "Посты"}
              value={searchQuery}
              onChangeText={handleSearch}
              placeholderTextColor="#fff"
            />
          </View>

          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, selectedTab === "users" && styles.activeTab]}
              onPress={() => setSelectedTab("users")}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === "users" && styles.activeTabText,
                ]}
              >
                Пользователи
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, selectedTab === "posts" && styles.activeTab]}
              onPress={() => setSelectedTab("posts")}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === "posts" && styles.activeTabText,
                ]}
              >
                Посты
              </Text>
            </TouchableOpacity>
          </View>

          {selectedTab === "users" ? (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <UserListItem item={item}/>
              )}
              ListEmptyComponent={
                loadingSearch ? (
                  <ActivityIndicator color="#fff" style={{ marginTop: 40 }} />
                ) : (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="person-outline" size={80} color="#fff" />
                    <Text style={styles.emptyText}>
                      {!searchQuery
                        ? "Введите имя или фамилию для поиска"
                        : "Пользователи не найдены"}
                    </Text>
                  </View>
                )
              }
            />
          ) : (
            <FlatList
              data={postResults}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <PostItem 
                  post={item} 
                  onLike={handleLike} 
                  isLiked={item.likes.includes(user?.id || '')}
                  onDelete={deletePost}
                  currentUserId={user?.id}
                />
              )}
              onEndReached={loadMorePosts}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                loadingPosts ? <ActivityIndicator color="#fff" /> : null
              }
              ListEmptyComponent={
                loadingSearch ? (
                  <ActivityIndicator color="#fff" style={{ marginTop: 40 }} />
                ) : (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="albums-outline" size={80} color="#fff" />
                    <Text style={styles.emptyText}>
                      {!searchQuery
                        ? "Введите часть текста или хэштег для поиска постов"
                        : "Посты не найдены"}
                    </Text>
                  </View>
                )
              }
            />
          )}
        </LinearGradient>
      </CustomLeftModal>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1e1e1e",
    paddingTop: 15,
    paddingHorizontal: 5
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginHorizontal: 10,
    marginBottom: 15,
  },
  icon: {
    marginRight: 5,
  },
  input: {
    flex: 1,
    color: "#fff",
    paddingVertical: 10,
  },
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
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    textAlign: 'center',
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  }
})

export default SearchScreen