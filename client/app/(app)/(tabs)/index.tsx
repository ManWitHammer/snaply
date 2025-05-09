import { Stack } from "expo-router"
import { StyleSheet, FlatList, ActivityIndicator } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import * as MediaLibrary from 'expo-media-library'
import CustomHeader from "../../components/CustomHeader"
import { useEffect, useState } from "react"
import useStore from "../../state/store"
import usePostsStore from "../../state/postsStore"
import PostItem from "../../components/PostItem"
import useAppearanceStore from "../../state/appStore";
import { GestureHandlerRootView } from 'react-native-gesture-handler'

export default function HomeScreen() {
  const { posts, loading, fetchPosts, likePost, deletePost } = usePostsStore()
  const { user } = useStore()
  const [refreshing, setRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const { getGradient } = useAppearanceStore()
  const activeColors = getGradient();

  useEffect(() => {
    const getPermissions = async () => {
      const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync()
      if (mediaStatus !== 'granted') {
        console.log('Media permission denied')
      }
    }
    getPermissions()
    fetchPosts(page)
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    setPage(1)
    await fetchPosts(1)
    setRefreshing(false)
  }

  const handleLoadMore = async () => {
    if (!loading) {
      setPage(prev => prev + 1)
      await fetchPosts(page + 1)
    }
  }

  const handleLike = (postId: string) => {
    if (!user?.id) return
    likePost(postId, user.id)
  }

  return (
    <GestureHandlerRootView style={{flex: 1}}>
        <LinearGradient colors={activeColors} style={styles.container}>
          <Stack.Screen options={{
            header: () => <CustomHeader title="Главная" showSearch />
          }} />
        
          <FlatList
            data={posts}
            renderItem={({ item }) => (
              <PostItem 
                post={item} 
                onLike={handleLike} 
                isLiked={item.likes.includes(user?.id || '')}
                onDelete={deletePost}
                currentUserId={user?.id}
              />
            )}
            keyExtractor={item => item._id}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            ListFooterComponent={
              loading ? <ActivityIndicator size="large" color="#fff" /> : null
            }
          />
        </LinearGradient>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  storiesContainer: { flexDirection: "row", marginBottom: 20 },
  story: { alignItems: "center" },
  storyText: { color: "#fff", fontSize: 12, marginTop: 5 },
  inputContainer: { marginBottom: 20 },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 10,
    borderRadius: 8,
    color: '#fff',
    marginBottom: 10
  },
  button: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  buttonText: {
    color: '#445b73',
    fontWeight: 'bold'
  },
  commentsRootContainer: {
    flex: 1,
    paddingBottom: 16,
  },
  commentsHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#445b73',
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  commentsListContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  commentsListContent: {
    paddingBottom: 70,
  },
  loader: {
    marginTop: 20,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    maxHeight: 100,
    backgroundColor: '#f5f5f5',
  },
  commentButton: {
    backgroundColor: '#445b73',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  commentButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  commentItem: {
    flexDirection: "row",
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  commentTextContainer: {
    flex: 1,
  },
  commentAuthor: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#445b73',
  },
  commentText: {
    fontSize: 14,
    color: '#333',
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#ddd',
  },
})