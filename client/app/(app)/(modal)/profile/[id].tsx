import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { 
  Dimensions, 
  StyleSheet, 
  SafeAreaView,
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator,
  Platform,
  FlatList,
  ActionSheetIOS
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import useStore, { IProfileDto, IUser as IUserDto } from '../../../state/store'
import { Post } from '../../../state/postsStore'
import PostItem from "../../../components/PostItem"
import usePostsStore from "../../../state/postsStore"
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet'
import NotFound from "../../../../assets/not-found"
import * as ImagePicker from "expo-image-picker"
import { ScrollView } from 'react-native-gesture-handler'
import useAppearanceStore from "../../../state/appStore"
import socketStore from "../../../state/socketStore"
import { Image } from "expo-image"
import { ProfileShimmer } from "../../../components/Shimmers"

export default function ProfileModal() {
  const router = useRouter()
  const { likePost, deletePost } = usePostsStore()
  const { setAvatar, getUser, user, sendFriendRequest, deleteFriend, acceptFriendRequest, rejectFriendRequest, setErrorMessage } = useStore()
  const { socket } = socketStore()
  const { id } = useLocalSearchParams()
  const [userData, setUserData] = useState<IProfileDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [image, setImage] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [page, setPage] = useState(1)
  const { getGradient } = useAppearanceStore()
  const activeColors = getGradient()

  const handleNewFriendRequest = (data: { userDto: IUserDto }) => {
    const { userDto } = data
    if (userData?.user._id === userDto.id) {
      setUserData(prev => {
        if (!prev) return null
        return {
          ...prev,
          user: {
            ...prev.user,
            hasPendingRequest: true
          }
        }
      })
    }
  }

  const handleFriendRequestAccepted = (data: { userDto: IUserDto }) => {
    const { userDto } = data
    if (userData?.user._id === userDto.id) {
      setUserData(prev => {
        if (!prev) return null
        return {
          ...prev,
          user: {
            ...prev.user,
            isFriend: true,
            friendsCount: prev.user.friendsCount + 1,
            friends: [...prev.user.friends, {
              _id: userDto.id || '',
              avatar: userDto.avatar
            }],
            hasPendingRequest: false,
            sentRequest: false
          }
        }
      })
    }  }

  const handleFriendRequestRejected = (data: { userDto: IUserDto }) => {
    const { userDto } = data
    if (userData?.user._id === userDto.id) {
      setUserData(prev => {
        if (!prev) return null
        return {
          ...prev,
          user: {
            ...prev.user,
            hasPendingRequest: false,
            sentRequest: false
          }
        }
      })
    }
  }

  const handleCheckOnline = (data: { userId: string, status: "online" | "offline" }) => {

    if (data.userId === id) {
      setUserData(prev => {
        if (!prev) return null
        return {
          ...prev,
          user: {
            ...prev.user,
            status: data.status
          }
        }
      })
    }
  }

    const handleCheckOffline = (data: { userId: string, status: "online" | "offline" }) => {
      if (data.userId === id) {
        setUserData(prev => {
          if (!prev) return null
          return {
            ...prev,
            user: {
              ...prev.user,
              status: data.status
            }
          }
        })
      }
    }

  useEffect(() => {
    if (!socket) return

    socket.on('newFriendRequest', handleNewFriendRequest)
    socket.on('friendRequestAccepted', handleFriendRequestAccepted)
    socket.on('friendRequestRejected', handleFriendRequestRejected)
    socket.on('friendOnline', handleCheckOnline)
    socket.on('friendOffline', handleCheckOffline)
    return () => {
      socket.off('newFriendRequest')
      socket.off('friendRequestAccepted')
      socket.off('friendRequestRejected')
      socket.off('friendOnline', handleCheckOnline)
      socket.off('friendOffline', handleCheckOffline)
    }
  }, [socket, userData, id, page])

  useEffect(() => {
    fetchUserData()
  }, [id])

  const fetchUserData = async () => {
    if (id) {
      try {
        const res = await getUser(id as string, page)
        setPage(prev => prev + 1)
        setUserData(prev => {
          return {
            user: res.user,
            posts: [...(prev?.posts || []), ...res.posts]
          }
        })
        setLoading(false)
      } catch (error) {
        setErrorMessage("что то пошло не так:(")
      }
    }
  }

  const handleLike = async (postId: string) => {
    if (!user?.id) return
    const res = await likePost(postId, user.id)
    if (res) {
      setUserData(prev => {
        if (!prev) return null
        return {
          ...prev,
          posts: prev.posts.map(post => 
            post._id === postId 
              ? { 
                  ...post, 
                  likes: post.likes.includes(user.id!) 
                    ? post.likes.filter(id => id !== undefined && id !== user.id) 
                    : [...post.likes.filter(id => id !== undefined), user.id]
                }
              : post
          )
        } as IProfileDto
      })
    }
  }
  
  const handleSendFriendRequest = async () => {
    const res = await sendFriendRequest(id as string)
    if (res) {
      setUserData(prev => {
        if (!prev) return null
        return {
          ...prev,
          user: {
            ...prev.user,
            isFriend: false,
            hasPendingRequest: false,
            sentRequest: true,
            friends: prev.user.friends.filter(friend => friend._id !== user?.id),
          }
        }
      })
    }
  }

  const bottomSheetModalRef = useRef<BottomSheetModal>(null)

  const snapPoints = useMemo(() => ['25%'], [])

  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present()
  }, [])

  const handleDismissModalPress = useCallback(() => {
    bottomSheetModalRef.current?.dismiss()
  }, [])
  const handlePublishPress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Отмена', "Создать пост", "Загрузить фото"],
        cancelButtonIndex: 0,
      },
      (buttonIndex) => {
        if (buttonIndex == 1) {
          handleCreatePost()
        } else if (buttonIndex == 2) {
          handleUploadPhoto()
        }
      })
    } else {
      handlePresentModalPress()
    }
  }

  const handleCloseBottomSheet = () => {
    handleDismissModalPress()
  }

  const handleCreatePost = () => {
    router.push('/create-post')
    if (Platform.OS !== 'ios') {
      handleCloseBottomSheet()
    }
  }

  const handleUploadPhoto = () => {
    router.push('/upload-photo')
    if (Platform.OS !== 'ios') {
      handleCloseBottomSheet()
    }
  }

  const handleDeleteFriend = async () => {
    const res = await deleteFriend(userData?.user._id!)
    if (res) {
      setUserData(prev => {
        if (!prev) return null
        return {
          ...prev,
          user: {
            ...prev.user,
            isFriend: false,
            hasPendingRequest: false,
            sentRequest: false,
            friends: prev.user.friends.filter(friend => friend._id !== user?.id),
            friendsCount: prev.user.friendsCount - 1
          }
        }
      })
    }
  }

  const handleAccept = async () => {
    if (!userData) return
    const success = await acceptFriendRequest(userData.user._id)
    if (success) {
      setUserData(prev => {
        if (!prev) return null
        return {
          ...prev,
          user: {
            ...prev.user,
            isFriend: true,
            hasPendingRequest: false,
            sentRequest: false,
            friends: [...prev.user.friends, {
              _id: user?.id!,
              avatar: user?.avatar!
            }],
            friendsCount: prev.user.friendsCount + 1
          }
        }
      })
    }
  }

  const handleReject = async (selfReject: boolean) => {
    if (!userData) return
    const success = await rejectFriendRequest(userData.user._id, selfReject)
    if (success) {
      setUserData(prev => {
        if (!prev) return null
        return {
          ...prev,
          user: {
            ...prev.user,
            isFriend: false,
            hasPendingRequest: false,
            sentRequest: false,
          }
        }
      })
    }
  }      

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== "granted") {
      alert("Для выбора изображения необходимо предоставить доступ к галерее.")
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    })

    if (!result.canceled) {
      try {
        setUploading(true)
        const formData = new FormData()
        formData.append('avatar', {
          uri: result.assets[0].uri,
          name: result.assets[0].fileName, 
          type: result.assets[0].mimeType,
        } as any)

        const success = await setAvatar(formData)

        if (success) {
          setImage(result.assets[0].uri)
        } else {
          setErrorMessage("Не удалось загрузить аватар")
        }
      } catch (error) {
        setErrorMessage("Ошибка при загрузке аватара")
      } finally {
        setUploading(false)
      }
    }
  }

    return (
      <SafeAreaView style={[styles.wrapper, {backgroundColor: activeColors[1]}]}>
        <SafeAreaView style={{flex: 1}}>
          <StatusBar hidden/>
          {loading ? <ProfileShimmer /> : (
            <ScrollView style={{flex: 1}}>
              <View style={styles.profileContainer}>
                <View style={styles.banner}>
                  <TouchableOpacity onPress={() => router.back()} style={[styles.arrowBack, { top: 10 }]}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={pickImage} style={styles.avatarPlaceholder}>
                    {image ? (
                      <View style={styles.imageContainer}>
                        <Image 
                          source={{ uri: image }} 
                          style={[styles.avatarImage, { borderColor: activeColors[0] }]} 
                        />
                        {uploading && (
                          <View style={styles.loaderContainer}>
                            <ActivityIndicator size="large" color={activeColors[0]} />
                          </View>
                        )}
                        {/* Индикатор статуса */}
                        <View style={[
                          styles.statusIndicator,
                          userData?.user.status === 'online' ? {...styles.online, borderColor: activeColors[0] } : {...styles.offline, borderColor: activeColors[0] }
                        ]} />
                      </View>
                    ) : userData?.user.avatar ? (
                      <View style={styles.imageContainer}>
                        <Image 
                          source={{ uri: userData.user.avatar }} 
                          style={[styles.avatarImage, { borderColor: activeColors[0] }]} 
                          placeholder={ userData.user.avatar.startsWith('http') ? { blurhash: new URL(userData.user.avatar).search.slice(1) } : undefined}
                        />
                        {uploading && (
                          <View style={styles.loaderContainer}>
                            <ActivityIndicator size="large" color="#fff" />
                          </View>
                        )}
                        <View style={[
                          styles.statusIndicator,
                          userData?.user.status === 'online' ? {...styles.online, borderColor: activeColors[0] } : {...styles.offline, borderColor: activeColors[0] }
                        ]} />
                      </View>
                    ) : (
                      <View style={[styles.imageContainer, { backgroundColor: activeColors[0] }]}>
                        <NotFound width={100} height={100}/>
                        <View style={[
                          styles.statusIndicator,
                          userData?.user.status === 'online' ? {...styles.online, borderColor: activeColors[0] } : {...styles.offline, borderColor: activeColors[0] }
                        ]} />
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
        
                <View style={[styles.profileInfo, { backgroundColor: activeColors[0] }]}>
                  <Text style={styles.profileName}>{userData?.user.name} {userData?.user.surname}</Text>
                  {userData && userData.user.description ? (
                    <Text style={[styles.profileDesc, { color: activeColors[1] }]}>{userData?.user.description}</Text>
                  ) : user && id == user.id ? (
                    <TouchableOpacity onPress={() => router.push('/account')} style={{flexDirection: "row", alignItems: "center", gap: 6}}>
                      <Text style={styles.addFriends}>Добавить информацию о себе</Text>
                      <Ionicons name="create-outline" size={20} color="#87ceeb" />
                    </TouchableOpacity>
                  ) : ""}
                    
                    {user && id == user.id ? (
                      <View style={styles.friendActionsContainer}>
                        <TouchableOpacity style={styles.publishButton} onPress={handlePublishPress}>
                          <Text style={[styles.publishText, { color: activeColors[0] }]}>Опубликовать</Text>
                          <Ionicons name="add" size={20} color={activeColors[0]} />
                        </TouchableOpacity>
                      </View>
                    ) : userData?.user.isFriend ? (
                      <View style={styles.friendActionsContainer}>
                        <TouchableOpacity 
                          style={styles.publishButton}
                          onPress={() => router.push(`/chat/${userData.user.chatId}`)}
                        >
                          <Text style={[styles.publishText, { color: activeColors[0] }]}>Сообщения</Text>
                          <Ionicons name="chatbubble-outline" size={20} color={activeColors[0]} />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.miniButton} 
                          onPress={handleDeleteFriend}
                        >
                          <Ionicons name="person-remove-outline" size={20} color={activeColors[0]} />
                        </TouchableOpacity>
                      </View>
                    ) : userData?.user.sentRequest ? (
                      <View style={styles.friendActionsContainer}>
                        <TouchableOpacity style={styles.publishButton} onPress={() => handleReject(true)}>
                          <Text style={[styles.publishText, { color: activeColors[0] }]}>В ожидании</Text>
                          <Ionicons name="close" size={20} color={activeColors[0]} />
                        </TouchableOpacity>
                        {userData?.user.chatId ? (
                          <TouchableOpacity
                            onPress={() => router.push(`/chat/${userData.user.chatId}`)}
                            style={styles.miniButton}
                          >
                            <Ionicons name="chatbubble-outline" size={20} color={activeColors[0]} />
                          </TouchableOpacity>
                        ) : ""}
                      </View>
                    ) : userData?.user.hasPendingRequest ? (
                      <View style={styles.friendActionsContainer}>
                        <TouchableOpacity style={styles.publishButton} onPress={handleAccept}>
                          <Text style={[styles.publishText, { color: activeColors[0] }]}>Принять заявку</Text>
                          <Ionicons name="checkmark" size={20} color={activeColors[0]} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleReject(false)}
                          style={styles.miniButton}
                        >
                          <Ionicons name="close" size={20} color={activeColors[0]} />
                        </TouchableOpacity>
                        {userData?.user.chatId ? (
                          <TouchableOpacity
                            onPress={() => router.push(`/chat/${userData.user.chatId}`)}
                            style={styles.miniButton}
                          >
                            <Ionicons name="chatbubble-outline" size={20} color={activeColors[0]} />
                          </TouchableOpacity>
                        ) : ""}
                      </View>
                    ) : (
                      <View style={styles.friendActionsContainer}>
                        <TouchableOpacity style={styles.publishButton} onPress={handleSendFriendRequest}>
                          <Text style={[styles.publishText, { color: activeColors[0] }]}>Добавить в друзья</Text>
                          <Ionicons name="add" size={20} color={activeColors[0]} />
                        </TouchableOpacity>
                        {userData?.user.chatId ? (
                          <TouchableOpacity
                            onPress={() => router.push(`/chat/${userData.user.chatId}`)}
                            style={styles.miniButton}
                          >
                            <Ionicons name="chatbubble-outline" size={20} color={activeColors[0]} />
                          </TouchableOpacity>
                        ) : ""}
                      </View>
                    )}
                </View>

                {userData && userData.user.friends.length > 0 ? (
                  <TouchableOpacity onPress={() => router.push(`/friends/${id}`)} style={[styles.friendsContainer, { backgroundColor: activeColors[0] }]}>
                    <View style={styles.friendsLeft}>
                      <Text style={styles.friendsCount}>{userData.user.friendsCount}
                        <Text style={styles.friendsLabel}>{userData.user.friendsCount == 1 ? "Друг" : userData?.user.friendsCount > 1 && userData?.user.friendsCount < 5 ? "Друга" : "Друзей"}</Text>
                      </Text>
                    </View>
                    
                    <View style={styles.friendsRight}>
                      {userData?.user?.friends?.map((friend) => (
                        <TouchableOpacity onPress={() => router.push(`/profile/${friend._id}`)} key={friend._id}>
                          {friend.avatar ? (
                            <Image
                              source={{ uri: friend.avatar }}
                              style={[styles.friendAvatar, { borderColor: activeColors[1] }]}
                              placeholder={ friend.avatar.startsWith('http') ? { blurhash: new URL(friend.avatar).search.slice(1) } : undefined}
                            />
                          ) : (
                            <Ionicons name="person-circle-outline" size={40} color="#fff" />
                          )}
                        </TouchableOpacity>
                        
                      ))}
                    </View>
                  </TouchableOpacity>
                ) : user && id == user.id ? (
                  <View style={[styles.friendsContainer, { backgroundColor: activeColors[0] }]}>
                    <Ionicons name="people-outline" size={40} color="#fff" />
                    <View style={styles.noFriends}>
                      <Text style={styles.friendsText}>Вы пока не добавили друзей</Text>
                      <TouchableOpacity onPress={() => router.push("/search/secret")}>
                        <Text style={styles.addFriendsText}>Добавить друзей</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : ""}

              </View>

              {userData && userData.user.sharedImages.length > 0 && (
                <View style={[styles.mediaContainer, { backgroundColor: activeColors[0] }]}>
                  <View style={styles.mediaTabContainer}>
                    <View style={styles.mediaTab}>
                      <Ionicons name="image-outline" size={20} color="#fff" />
                      <Text style={styles.mediaText}>Общие фото из чата</Text>
                    </View>
                  </View>
                  <View style={styles.photosGrid}>
                    {userData?.user.sharedImages.map((photo) => (
                      <Image 
                        source={{ uri: photo }} 
                        style={styles.photoItem}
                        key={photo}
                        placeholder={ photo.startsWith('http') ? { blurhash: new URL(photo).search.slice(1) } : undefined}
                      />
                    ))}
                  </View>
                  <TouchableOpacity 
                    style={styles.viewMoreButton}
                    onPress={() => router.push(`/sharedImages/${id}`)}
                  >
                    <Text style={[styles.viewMoreText, { color: activeColors[0] }]}>Посмотреть всё</Text>
                  </TouchableOpacity>
                </View>
              )}
        
              <View style={[styles.mediaContainer, { backgroundColor: activeColors[0] }]}>
                <View style={styles.mediaTabContainer}>
                  <View style={styles.mediaTab}>
                    <Ionicons name="image-outline" size={20} color="#fff" />
                    <Text style={styles.mediaText}>Фото</Text>
                  </View>
                </View>
                {userData && userData.user.photos.length > 0 ? (
                  <>
                    <View style={styles.photosGrid}>
                      {userData?.user.photos.map((photo) => (
                          <Image 
                            source={{ uri: photo }} 
                            style={styles.photoItem}
                            key={photo}
                            placeholder={ photo.startsWith('http') ? { blurhash: new URL(photo).search.slice(1) } : undefined}
                          />
                      ))}
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.viewMoreButton}
                      onPress={() => router.push(`/photos/${id}`)}
                    >
                      <Text style={[styles.viewMoreText, { color: activeColors[0] }]}>Посмотреть всё</Text>
                    </TouchableOpacity>
                  </>
                ) : user && id == user.id ? (
                  <View style={{flex: 1, alignItems: "center", justifyContent: "center"}}>
                    <Text style={styles.noPhotosText}>Вы ещё не загрузили ни одно фото</Text>
                    <TouchableOpacity 
                      style={styles.uploadButton}
                      onPress={() => router.push('/upload-photo')}
                    >
                      <Text style={[styles.uploadText, { color: activeColors[0] }]}>Загрузить фото</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={styles.noPhotosText}>
                    {userData?.user.photos.length === 0 
                      ? "У пользователя нет фотографий" 
                      : "Пользователь скрыл фотографии"}
                  </Text>
                )}
              </View>
              <View style={[styles.mediaContainer, { backgroundColor: activeColors[0] }]}>
                <View style={styles.mediaTabContainer}>
                  <View style={styles.mediaTab}>
                    <Ionicons name="albums-outline" size={20} color="#fff" />
                    <Text style={styles.mediaText}>Посты</Text>
                  </View>
                </View>

                {userData && userData.posts.length > 0 ? (
                  <FlatList
                    data={userData?.posts}
                    renderItem={({ item }: { item: Post }) => (
                      <PostItem 
                        post={item} 
                        onLike={handleLike} 
                        isLiked={item.likes.includes(user?.id || '')}
                        onDelete={deletePost}
                        currentUserId={user?.id}
                      />
                    )}
                    scrollEnabled={false}
                    keyExtractor={item => item._id}
                    onEndReached={() => !loading && fetchUserData()}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={
                      loading ? <ActivityIndicator size="large" color="#fff" /> : null
                    }
                  />
                ) : user && id == user.id ? (
                  <View style={{flex: 1, alignItems: "center", justifyContent: "center"}}>
                    <Text style={styles.noPhotosText}>Вы ещё не загрузили ни одного поста</Text>
                    <TouchableOpacity 
                      style={styles.uploadButton}
                      onPress={() => router.push('/create-post')}
                    >
                      <Text style={[styles.uploadText, { color: activeColors[0] }]}>Отправить пост</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={styles.noPhotosText}>
                    {userData?.user.photos.length === 0 
                      ? "У пользователя нет постов" 
                      : "Пользователь скрыл посты"}
                  </Text>
                )}
              </View>
            </ScrollView>
          )}
          <BottomSheetModal
            ref={bottomSheetModalRef}
            index={0}
            snapPoints={snapPoints}
            backdropComponent={(props) => (
              <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
              />
            )}
            backgroundStyle={{ backgroundColor: activeColors[0] }}
            handleIndicatorStyle={{ 
              backgroundColor: 'white'
            }}
          >
            <BottomSheetView style={styles.bottomSheetContent}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Опубликовать</Text>
              <TouchableOpacity onPress={handleDismissModalPress}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
              <TouchableOpacity 
                style={styles.bottomSheetItem} 
                onPress={handleCreatePost}
              >
                <Ionicons name="document-text-outline" size={24} color="#fff" />
                <Text style={styles.bottomSheetText}>Создать пост</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.bottomSheetItem} 
                onPress={handleUploadPhoto}
              >
                <Ionicons name="image-outline" size={24} color="#fff" />
                <Text style={styles.bottomSheetText}>Загрузить фото</Text>
              </TouchableOpacity>
            </BottomSheetView>
          </BottomSheetModal>
        </SafeAreaView>
      </SafeAreaView>
    )
  }

// Стили
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)'
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    flex: 1,
  },
  bottomSheetContent: {
    padding: 20,
  },
  bottomSheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    gap: 10
  },
  bottomSheetText: {
    color: '#fff',
    fontSize: 16
  },
  arrowBack: {
    position: "absolute",
    left: 10, 
    marginTop: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    zIndex: 1,
    padding: 5,
    borderRadius: 20
  },
  wrapper: {
    flex: 1
  },
  friendActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: 10,
    gap: 5
  },
  friendActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  messageButton: {
    backgroundColor: '#445b73',
  },
  removeFriendButton: {
    backgroundColor: '#e74c3c',
  },
  friendActionText: {
    color: '#fff',
    marginLeft: 5,
    fontSize: 14,
  },
  uploadButtonSkeleton: {
    width: "60%",
    height: 40,
    borderRadius: 20,
  },
  loaderWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#749bb8',
  },
  loaderText: {
    marginTop: 10,
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  profileContainer: {
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#445b73',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  name: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  bio: { color: '#d3d3d3', fontSize: 16 },
  banner: {
    position: "relative",
    width: "100%",
    height: 180,
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
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
    borderWidth: 3,
  },
  profileInfo: { 
    width: "100%", 
    padding: 20, 
    borderRadius: 10, 
    alignItems: "center",
    paddingTop: 45,
    marginBottom: 10
  },
  profileName: { color: "#fff", fontSize: 22, fontWeight: "bold", marginTop: 10, textAlign: "center" },
  profileDesc: { color: "#DCDCDC", fontSize: 14, marginTop: 5 },
  publishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  miniButton: {
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 20,
  },
  publishText: { color: "#445b73", fontWeight: "bold" },
  friendsContainer: {
    width: '100%',
    backgroundColor: '#445b73',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  friendsLeft: {
    flexDirection: 'column',
  },
  friendsCount: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  friendsLabel: {
    color: '#fff',
    fontSize: 14,
  },
  friendsRight: {
    flexDirection: 'row',
    gap: -10,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 25,
    borderWidth: 2,
  },
  addFriendsText: {
    color: '#87ceeb',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  noFriends: {
    flexDirection: 'column',
    marginLeft: 10,
  },
  friendsText: {
    color: '#fff',
    fontSize: 16,
  },
  addFriends: { color: "#87ceeb", fontSize: 14 },
  mediaContainer: {
    marginTop: 10,
    borderRadius: 10,
    padding: 15,
    width: '100%',
  },
  mediaTabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
    paddingBottom: 10,
    marginBottom: 15,
  },
  mediaTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 5, // Отступ слева
  },
  mediaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  mediaTabs: { flexDirection: "row", justifyContent: "space-around", width: "100%", marginBottom: 5 },
  noPhotosText: { color: "#ccc", marginBottom: 10, marginTop: 0 },
  uploadButton: { backgroundColor: "#fff", padding: 10, borderRadius: 10 },
  uploadText: { color: "#445b73", fontWeight: "bold" },
  imageContainer: {
    borderRadius: 50,
    position: 'relative',
    width: 100,
    height: 100,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#749bb8',
  },
  online: {
    backgroundColor: '#51c26d', 
  },
  offline: {
    backgroundColor: '#9E9E9E', 
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
  photosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
  },
  photoItem: {
    width: (Dimensions.get('window').width - 40) / 3,
    height: (Dimensions.get('window').width - 40) / 3,
    borderRadius: 8,
    marginBottom: 4,
  },
  viewMoreButton: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    width: "60%",
    alignSelf: "center",
    marginTop: 5,
  },
  viewMoreText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
})