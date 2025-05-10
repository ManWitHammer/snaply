import { useState, useEffect, useRef } from "react"
import { View, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, TextInput, ActivityIndicator, Text, Keyboard } from "react-native"
import CommentsSheet from "../../../components/CustomCommentSheet"
import PostItem from "../../../components/PostItem"
import { LinearGradient } from "expo-linear-gradient"
import CustomModal from "../../../components/CustomLeftModal"
import useStore from "../../../state/store"
import { useLocalSearchParams } from "expo-router"
import usePostsStore, { Post, Comment } from "../../../state/postsStore"
import useAppearanceStore from "../../../state/appStore"
import Ionicons from "@expo/vector-icons/Ionicons"
import LottieView from 'lottie-react-native'

export default function PostScreen() {
  const { id } = useLocalSearchParams()
  const { user } = useStore()
  const { likePost, deletePost, fetchPost, addComment, deleteComment, editComment } = usePostsStore()
  const [text, setText] = useState("")
  const [editingComment, setEditingComment] = useState<Comment | null>(null)
  const { getGradient, confetti, getLastEmoji } = useAppearanceStore()
  const activeColors = getGradient()
  const [showConfetti, setShowConfetti] = useState(false)
  const [keyboardVisible, setKeyboardVisible] = useState(false)
  const inputRef = useRef<TextInput>(null)
  const [postData, setPostData] = useState<{
    post: Post
    comments: Comment[]
  } | null>(null)

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true))
    const hideSub = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false))
      
    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [])

  useEffect(() => {
    const loadPost = async () => {
      if (typeof id == "string") {
        const data = await fetchPost(id)
        setPostData(data)
      }
    }
    loadPost()
  }, [id])

  useEffect(() => {
      if (editingComment) {
        inputRef.current?.focus()
      }
    }, [editingComment])

  const handleDeleteComment = async (commentId: string) => {
    if (!user?.id) return

    const data = await deleteComment(id as string, commentId)
    if (data) {
      const updatedComments = postData?.comments.filter(comment => comment._id !== commentId)
      setPostData(state => {
        if (!state) return state
        return {
          ...state,
          comments: updatedComments || [],
        }
      })
    }
    
  }

  const handleLike = async (postId: string) => {
    if (!user?.id) return
    const res = await likePost(postId, user.id)
    if (res) {
      setPostData(state => {
        if (!state) return state
        const likeIndex = state.post.likes.indexOf(user.id!)
        return {
          ...state,
          post: {
            ...state.post,
            likes: likeIndex === -1 
              ? [...state.post.likes, user.id!]
              : state.post.likes.filter(id => id !== user.id)
          }
        }
      })
    }
    
  }
  
  const handleSubmitComment = async () => {
    if (!user?.id) return;
    const trimmedText = text.trim() + getLastEmoji()
    if (!trimmedText) return
    if (trimmedText.length > 400) return
  
    if (editingComment) {
      const updated = await editComment(id as string, editingComment._id, trimmedText);
      if (updated) {
        setPostData(state => {
          if (!state) return state;
          return {
            ...state,
            comments: state.comments.map(comment =>
              comment._id === editingComment._id ? { ...comment, text: trimmedText } : comment
            ),
          };
        });
        setEditingComment(null);
      }
    } else {
      if (confetti && trimmedText.toLowerCase().includes("конфетти")) {
        setShowConfetti(true)
      }
      const data = await addComment(id as string, trimmedText);
      setPostData(state => {
        if (!state) return state;
        return {
          ...state,
          comments: [data, ...state.comments],
        };
      });
    }
  
    setText("");
  };

  if (!postData) {
    return (
      <CustomModal title="Пост на стене">
        <LinearGradient colors={activeColors} style={{ flex: 1, alignItems: "center", justifyContent: "center" }} >
          <ActivityIndicator size="large" color="#fff" />
        </LinearGradient>
      </CustomModal>
    )
  }

  return (
    <CustomModal title="Пост на стене">
      <LinearGradient colors={activeColors} style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={100}
          enabled={keyboardVisible}
        >
          <ScrollView 
            style={styles.container}
            contentContainerStyle={{flexGrow: 1}}
            keyboardShouldPersistTaps="handled"
          >
            <PostItem 
              post={postData.post} 
              onLike={handleLike} 
              isLiked={postData.post.likes.includes(user?.id || '')}
              onDelete={deletePost}
              currentUserId={user?.id}
              commentPressable
            />
              
            {postData.post.commentsEnabled && (
              <View style={styles.commentsContainer}>
                <CommentsSheet 
                  comments={postData.comments}
                  onDeleteComment={handleDeleteComment}
                  onEditComment={(comment) => {
                    setEditingComment(comment);
                    setText(comment.text);
                  }}
                />
              </View>
            )}
          </ScrollView>

          {postData.post.commentsEnabled && (
            <View style={[styles.inputContainer, { backgroundColor: activeColors[0] }]}>
              {text.length > 400 && (
                <View style={[styles.editHeader, { backgroundColor: activeColors[0] }]}>
                  <Text style={styles.editHeaderText}>
                    Превышен лимит в 400 символов
                  </Text>
                </View>
              )}
              {editingComment && (
                <View style={[styles.editHeader, { backgroundColor: activeColors[0] }]}>
                  <Text style={styles.editHeaderText}>
                    Редактирование комментария
                  </Text>
                  <TouchableOpacity onPress={() => {
                    setEditingComment(null);
                    setText('');
                  }}>
                    <Ionicons name="close" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
              <View style={[styles.inputRow]}>
                <TextInput
                  ref={inputRef}
                  style={styles.commentInput}
                  value={text}
                  onChangeText={setText}
                  placeholder="Написать комментарий..."
                  placeholderTextColor="#fff"
                  onSubmitEditing={handleSubmitComment}
                />
                <TouchableOpacity style={styles.sendButton} onPress={handleSubmitComment}>
                  <Ionicons name="send" size={24} color={activeColors[0]} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
        {confetti && showConfetti && (
          <LottieView
            source={require('../../../../assets/confetti.json')}
            autoPlay
            loop={false}
            onAnimationFinish={() => setShowConfetti(false)}
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 10,
            }}
          />
        )}
      </LinearGradient>
    </CustomModal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 50
  },
  commentsContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e5e5ea',
    paddingVertical: 6
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 130,
    minHeight: 40,
    marginRight: 10,
  },
  commentInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#fff',
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#fff',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5ea',
  },
  editHeaderText: {
    color: '#fff',
    fontSize: 14,
  },
})