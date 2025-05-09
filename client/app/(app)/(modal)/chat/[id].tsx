import { useState, useEffect, useRef } from "react"
import { View, Text, StyleSheet, SectionList, TextInput, TouchableOpacity, KeyboardAvoidingView, Keyboard, Dimensions, TouchableWithoutFeedback } from "react-native"
import * as Clipboard from "expo-clipboard"
import ImageView from '@staltz/react-native-image-viewing'
import * as MediaLibrary from 'expo-media-library'
import * as FileSystem from 'expo-file-system'
import CustomLeftModal from "../../../components/CustomLeftModal"
import { LinearGradient } from "expo-linear-gradient"
import { useLocalSearchParams, useRouter } from "expo-router"
import useChatsStore, { ChatMessage, ChatParticipant } from "../../../state/chatsStore"
import useStore from "../../../state/store"
import Ionicons from "@expo/vector-icons/Ionicons"
import * as ImagePicker from 'expo-image-picker'
import { format, isSameDay, parseISO } from "date-fns"
import useAppearanceStore from "../../../state/appStore"
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import { ru } from 'date-fns/locale'
import MessageItem from "../../../components/MessageItem"
import OptionsMenu from "../../../components/OptionsMenu"
import ShareBottomSheet from '../../../components/ShareBottomSheet'
import socketStore from "../../../state/socketStore"
import LottieView from 'lottie-react-native'
import { Image } from 'expo-image'
import { ChatShimmer } from '../../../components/Shimmers'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const { width: SCREEN_WIDTH } = Dimensions.get('window')

interface Option {
  label: string
  icon: keyof typeof Ionicons.glyphMap
  action: () => void | Promise<void>
  color?: string
}

interface ImageDto {
  uri: string
  type: string
  name: string
}

// console.error

export default function ChatScreen() {
  const router = useRouter()
  const { id: chatId } = useLocalSearchParams()
  const { fetchMessages, sendMessage, setCurrentChatId, deleteMessage, editMessage } = useChatsStore()
  const { user, setErrorMessage } = useStore()
  const { socket } = socketStore()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [otherParticipant, setOtherParticipant] = useState<ChatParticipant & { status: "online" | "offline", typing: boolean } | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [sending, setSending] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null)
  const [showOptions, setShowOptions] = useState(false)
  const [optionsPosition, setOptionsPosition] = useState({ x: 0, y: 0 })
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null)
  const [editText, setEditText] = useState("")
  const [selectedImage, setSelectedImage] = useState<ImageDto | null>(null)
  const [visibleImageId, setVisibleImageId] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const { getGradient, getCommentColor, getLastEmoji, confetti } = useAppearanceStore()
  const commentColor = getCommentColor()
  const activeColors = getGradient()
  const [keyboardVisible, setKeyboardVisible] = useState(false)
  const inputRef = useRef<TextInput>(null)
  const bottomSheetModalRef = useRef<BottomSheetModal>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true))
    const hideSub = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false))
    
    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [])
  
  const handleInputChange = (text: string) => {
    setInputValue(text)

    socket?.emit('typing', { chatId, userId: user?.id })

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit('stopTyping', { chatId, userId: user?.id })
    }, 3000)
  }

  const loadMessages = async () => {
    if (!hasMore || loading) return

    setLoading(true)
    try {
      const data = await fetchMessages(chatId as string, page)

      const processedMessages = data.messages.map(msg => ({
        ...msg,
        isOwnMessage: msg.sender._id === user?.id
      }))
      setMessages(prev => [...prev, ...processedMessages])
      setHasMore(data.hasMore)
      setOtherParticipant(data.otherParticipant ? { ...data.otherParticipant, typing: false } : undefined)
      setPage(prev => prev + 1)
    } catch(err) {
      setErrorMessage("Что-то пошло не так при отправке сообщения")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (editingMessage) {
      inputRef.current?.focus()
    }
  }, [editingMessage])

  useEffect(() => {
    const handleNewMessage = (data: {
      from: string
      userDto: ChatParticipant
      message: ChatMessage
      chatId: string
    }) => {
      if (data.chatId === chatId) {
        const isOwnTempMessage = messages.some(
          msg => msg.isTemp && msg.content === data.message.content && msg.isOwnMessage
        )
        
        if (!isOwnTempMessage) {
          const newMessage: ChatMessage = {
            ...data.message,
            isOwnMessage: data.from === user?.id,
          }
          setMessages(prev => [newMessage, ...prev.filter(msg => !msg.isTemp)])
        } else {
          setMessages(prev => 
            prev.map(msg => 
              msg.isTemp && msg.content === data.message.content
                ? {
                    ...msg,
                    _id: data.message._id,
                    timestamp: data.message.timestamp,
                    isTemp: false
                  }
                : msg
            )
          )
        }
      }
    }

    const handleMessageDeleted = (data: { chatId: string, messageId: string }) => {
      console.log(data)
      if (data.chatId === chatId) {
        setMessages(prev => prev.filter(msg => msg._id !== data.messageId))
        setShowOptions(false)
        setSelectedMessage(null)
      }
    }
  
    const handleMessageEdited = (data: { chatId: string, messageId: string, newMessage: string }) => {
      if (data.chatId === chatId) {
        setMessages(prev =>
          prev.map(msg =>
            msg._id === data.messageId
              ? { ...msg, content: data.newMessage, isEdited: true }
              : msg
          )
        )
        setShowOptions(false)
        setSelectedMessage(null)
      }
    }

    const handleTyping = (data: { chatId: string, userId: string }) => {
      if (data.chatId === chatId) {
        setOtherParticipant(prev => prev ? { ...prev, typing: true } : prev)
      }
    }

    const handleStopTyping = (data: { chatId: string, userId: string }) => {
      if (data.chatId === chatId) {
        setOtherParticipant(prev => prev ? { ...prev, typing: false } : prev)
      }
    }

    const handleCheckOnline = (data: { userId: string, status: "online" | "offline" }) => {
      if (data.userId === otherParticipant?._id) {
        setOtherParticipant(prev => prev ? { ...prev, status: data.status } : prev)
      }
    }

    const handleCheckOffline = (data: { userId: string }) => {
      console.log(data)
      if (data.userId === otherParticipant?._id) {
        setOtherParticipant(prev => prev ? { ...prev, status: "offline" } : prev)
      }
    }

    socket?.on('messageDeleted', handleMessageDeleted)
    socket?.on('messageEdited', handleMessageEdited)
    socket?.on('newMessage', handleNewMessage)
    socket?.on('onTyping', handleTyping)
    socket?.on('onStopTyping', handleStopTyping)
    socket?.on('friendOnline', handleCheckOnline)
    socket?.on('friendOffline', handleCheckOffline)
    return () => {
      socket?.off('newMessage', handleNewMessage)
      socket?.off('messageEdited', handleMessageEdited)
      socket?.off('messageDeleted', handleMessageDeleted)
      socket?.off('onTyping', handleTyping)
      socket?.off('onStopTyping', handleStopTyping)
      socket?.on('friendOnline', handleCheckOnline)
      socket?.on('friendOffline', handleCheckOffline)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      socket?.emit('stopTyping', { chatId, userId: user?.id })
    }
  }, [socket, chatId, user, messages])

  const getFileExtension = (mimeType?: string) => {
    if (!mimeType) return 'jpg'
      const parts = mimeType.split('/')
      return parts[1] === 'png' ? 'png' : 
        parts[1] === 'gif' ? 'gif' : 'jpg'
  }

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 1,
    })

    if (!result.canceled) {
      const newImage = {
        uri: result.assets[0].uri,
        type: result.assets[0].mimeType || 'image/jpeg',
        name: `image-${Date.now()}.${getFileExtension(result.assets[0].mimeType)}`
      }
      setSelectedImage(newImage)
    }
  }

  const openBottomSheet = async () => {
    bottomSheetModalRef.current?.present()
  }

  const getImageForViewer = () => {
    if (!visibleImageId) return []
    
    const message = messages.find(msg => msg._id === visibleImageId)
    if (!message?.image) return []
    
    return [{ uri: message.image }]
  }

  const handleLongPress = (message: ChatMessage, event: any) => {
    console.log('Long press detected on message:', message)
    const { pageX, pageY } = event.nativeEvent
    
    const isNearBottom = pageY > SCREEN_HEIGHT - 200
    const isNearTop = pageY < 150
    const isNearRight = pageX > SCREEN_WIDTH - 150
    const isNearLeft = pageX < 150
    
    setSelectedMessage(message)
    setOptionsPosition({ 
      x: isNearRight ? SCREEN_WIDTH - 300 : 
         isNearLeft ? 0 : pageX - 150,
      y: isNearBottom ? SCREEN_HEIGHT - 200 : 
         isNearTop ? 0 : pageY - 50
    })
    setShowOptions(true)
  }
  const handleOutsidePress = () => {
    if (showOptions) {
      setShowOptions(false)
      setSelectedMessage(null)
    }
    if (editingMessage) {
      setEditingMessage(null)
    }
  }

  const handleDelete = async () => {
    if (!selectedMessage) return
    
    try {
      const response = await deleteMessage(chatId as string, selectedMessage._id)
      if (response) {
        setMessages(prev => prev.filter(msg => msg._id !== selectedMessage._id))
      }
    } catch (error) {
      return
    } finally {
      setShowOptions(false)
      setSelectedMessage(null)
    }
  }

  const handleEdit = () => {
    if (!selectedMessage) return
    setEditingMessage(selectedMessage)
    setEditText(selectedMessage.content)
    setShowOptions(false)
  }

  const handleCopy = () => {
    if (!selectedMessage) return
    Clipboard.setStringAsync(selectedMessage.content)
    setShowOptions(false)
  }

  const saveEdit = async () => {
    if (!editingMessage) return
    const newText = editText.trim().replace(/\n{2,}/g, '\n\n') + getLastEmoji()
    
    try {
      const response = await editMessage(
        chatId as string, 
        editingMessage._id, 
        newText
      )
      
      if (response) {
        setMessages(prev =>
          prev.map(msg =>
            msg._id === editingMessage._id
              ? { ...msg, content: newText, isEdited: true }
              : msg
          )
        )
        setEditingMessage(null)
        setInputValue("")
      }
    } catch (error) {
      return
    }
  }

  const groupMessagesByDate = (messages: ChatMessage[]) => { 
    const sorted = [...messages].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  
    const grouped: { title: string, data: ChatMessage[] }[] = []
  
    sorted.forEach(message => {
      const messageDate = parseISO(message.timestamp)
      const formattedDate = format(messageDate, "d MMMM", { locale: ru })
  
      const lastGroup = grouped[grouped.length - 1]
  
      if (lastGroup && isSameDay(parseISO(lastGroup.data[0].timestamp), messageDate)) {
        lastGroup.data.push(message)
      } else {
        grouped.push({ 
          title: formattedDate, 
          data: [message]
        })
      }
    })
  
    return grouped
  }

  const handleSend = async () => {
    if (inputValue.length > 2500) return
    if (editingMessage) {
      saveEdit()
      return
    }

    if (!inputValue.trim() && selectedImage) {
      setErrorMessage("Для отправки сообщения введите хоть что-то")
      return
    }

    if (!inputValue.trim() || sending || !user) return

    socket?.emit('stopTyping', { chatId, userId: user.id })
    
    const content = inputValue.trim().replace(/\n{2,}/g, '\n\n') + getLastEmoji()
    setSending(true)

    if (content.toLowerCase().includes("конфетти")) {
      setShowConfetti(true)
    }
  
    const tempId = `temp-${Date.now()}`
    const tempMessage: ChatMessage = {
      _id: tempId,
      sender: {
        _id: user.id!,
        name: user.name,
        surname: user.surname || "",
        avatar: user.avatar || null,
      },
      content,
      image: selectedImage ? selectedImage.uri : "",
      isEdited: false,
      isOwnMessage: true,
      timestamp: new Date(Date.now()).toISOString(),
      isTemp: true,
    }
  
    setMessages(prev => [tempMessage, ...prev])
    setInputValue("")
  
    try {
      const formData = new FormData()
      if (selectedImage) {
        formData.append('image', {
          uri: selectedImage.uri,
          type: selectedImage.type,
          name: selectedImage.name,
        } as any)
      }

      formData.append('message', content)
      setSelectedImage(null)
      
      const response = await sendMessage(chatId as string, formData)
      console.log(response.messageId)
      if (response.success) {
        setMessages(prev => [
          { ...prev[0], _id: response.messageId!, isTemp: false, timestamp: new Date(Date.now()).toISOString(), image: response.image || "" },
          ...prev.slice(1)
        ])
      }
    } catch (err) {
      setErrorMessage("что то пошло не так:(")
      setMessages(prev => prev.filter(msg => msg._id !== tempId))
    } finally {
      setSending(false)
    }
  }
  useEffect(() => {
    loadMessages()
    setCurrentChatId(chatId as string)
    return () => {
      setCurrentChatId(null)
    }
  }, [chatId])

  const handleSaveImage = async () => {
    if (!selectedMessage?.image) return
    
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync()
      if (status !== 'granted') {
        alert('Для сохранения изображения нужны разрешения на доступ к галерее')
        return
      }

      const fileUri = FileSystem.cacheDirectory + `image_${Date.now()}.jpg`
      const { uri } = await FileSystem.downloadAsync(
        selectedMessage.image,
        fileUri
      )

      const asset = await MediaLibrary.createAssetAsync(uri)
      await MediaLibrary.createAlbumAsync('Downloads', asset, false)
      
    } catch (error) {
      console.log(error)
    } finally {
      setShowOptions(false)
    }
  }

  const options = [
    {
      label: 'Копировать',
      icon: 'copy-outline',
      action: handleCopy,
    },
    {
      label: 'Переслать',
      icon: 'arrow-redo-outline',
      action: openBottomSheet,
    },
    ...(selectedMessage?.forwardedFromPost
      ? [{
          label: 'Посмотреть пост',
          icon: 'albums-outline',
          action: () => {
            router.push('/post/' + selectedMessage?.forwardedFromPost?._id)
            setShowOptions(false)
          }
        }]
      : []),
    ...(!selectedMessage?.forwardedFromPost && !selectedMessage?.forwardedFromUser && selectedMessage?.isOwnMessage
      ? [{
          label: 'Редактировать',
          icon: 'create-outline',
          action: handleEdit
        }]
      : []),
    ...(selectedMessage?.forwardedFromUser
      ? [{
          label: 'Посмотреть профиль',
          icon: 'person-outline',
          action: () => {
            router.push('/profile/' + selectedMessage?.forwardedFromUser?._id)
            setShowOptions(false)
          }
        }]
      : []),
    ...(selectedMessage?.isOwnMessage
      ? [{
          label: 'Удалить',
          icon: 'trash-outline',
          action: handleDelete,
          color: '#ff3040'
        }]
      : []),
    ...(selectedMessage?.image
      ? [{
          label: 'Сохранить изображение',
          icon: 'download-outline',
          action: handleSaveImage
        }, {
          label: 'Посмотреть изображение',
          icon: 'eye-outline',
          action: () => {
            setVisibleImageId(selectedMessage._id)
            setShowOptions(false)
          }
        }]
      : []),
  ] as Option[]

  const groupedMessages = groupMessagesByDate(messages)

  return (
    <CustomLeftModal title="Чат" accountInfo={otherParticipant} bottomSheetEnable>
      <TouchableWithoutFeedback onPress={handleOutsidePress}>
          <LinearGradient colors={activeColors} style={styles.container}>
            <ImageView
              images={getImageForViewer()}
              imageIndex={0}
              visible={!!visibleImageId}
              onRequestClose={() => setVisibleImageId(null)}
              presentationStyle="overFullScreen"
              backgroundColor="rgb(0, 0, 0)"
              swipeToCloseEnabled
              doubleTapToZoomEnabled
            />
            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={"padding"}
              keyboardVerticalOffset={100}
              enabled={keyboardVisible}
            >
              <SectionList
                sections={groupedMessages}
                keyExtractor={(item) => item._id}
                inverted
                onEndReached={loadMessages}
                onEndReachedThreshold={0.5}
                ListEmptyComponent={() => (
                  !hasMore ? (
                    <View style={{ alignItems: "center", marginVertical: 8 }}>
                      <Text style={{ color: "#fff", fontSize: 13 }}>
                        Сообщений нет
                      </Text>
                    </View>
                  ) : (
                    <ChatShimmer/>
                  )
                )}
                renderSectionFooter={({ section: { title } }) => (
                  <View style={{ alignItems: "center", marginVertical: 8 }}>
                    <View
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.2)",
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                        borderRadius: 12,
                      }}
                    >
                      <Text style={{ color: "#fff", fontSize: 13 }}>{title}</Text>
                    </View>
                  </View>
                )}
                renderItem={({ item }) => (
                  <MessageItem
                    item={item}
                    handleLongPress={handleLongPress}
                    setShowOptions={setShowOptions}
                    commentColor={commentColor}
                  />
                )}
                contentContainerStyle={styles.messagesList}
              />

              <OptionsMenu
                visible={showOptions}
                options={options}  
                position={optionsPosition}
                onClose={() => setShowOptions(false)}
              />

              <View style={[styles.inputContainer, { backgroundColor: activeColors[0] }]}>
                {selectedImage && (
                  <View style={styles.imagePreviewContainer}>
                    <Image 
                      source={{ uri: selectedImage.uri }} 
                      style={styles.imagePreview} 
                      placeholder={{ blurhash: new URL(selectedImage.uri).search.slice(1) }}
                    />
                    <TouchableOpacity 
                      style={[styles.removeImageButton, { backgroundColor: activeColors[1] }]}
                      onPress={() => setSelectedImage(null)}
                    >
                      <Ionicons name="close" size={20} color="white" />
                    </TouchableOpacity>
                  </View>
                )}
                {editingMessage && (
                  <View style={[styles.editHeader, { backgroundColor: activeColors[0] }]}>
                    <Text style={styles.editHeaderText}>Редактирование сообщения</Text>
                    <TouchableOpacity onPress={() => setEditingMessage(null)}>
                      <Ionicons name="close" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}

                {inputValue.length > 2500 && (
                  <View style={[styles.editHeader, { backgroundColor: activeColors[0] }]}>
                    <Text style={styles.editHeaderText}>Превышен лимит в 2500 символов</Text>
                  </View>
                )}

                <View style={styles.inputRow}>
                  <TouchableOpacity 
                    style={styles.attachmentButton}
                    onPress={pickImage}
                  >
                    <Ionicons name="image-outline" size={24} color="#fff" />
                  </TouchableOpacity>

                  <TextInput
                    ref={inputRef}
                    style={styles.input}
                    value={editingMessage ? editText : inputValue}
                    onChangeText={text => editingMessage ? setEditText(text) : handleInputChange(text)}
                    placeholder={editingMessage ? "" : "Напиcать..."}
                    placeholderTextColor="#ccc"
                    multiline
                    editable={!sending}
                    onSubmitEditing={handleSend}
                  />

                  <TouchableOpacity 
                    onPress={handleSend} 
                    style={styles.sendButton}
                    disabled={sending}
                  >
                    <Ionicons 
                      name={editingMessage ? "checkmark" : "send"} 
                      size={20} 
                      color={ activeColors[0] } 
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
            {showConfetti && confetti && (
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
            <ShareBottomSheet 
              bottomSheetModalRef={bottomSheetModalRef}
              selectedMessage={selectedMessage}
              otherParticipant={selectedMessage?.sender}
            />
          </LinearGradient>
      </TouchableWithoutFeedback>
    </CustomLeftModal>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5'},
  messagesList: {
    padding: 12,
    paddingBottom: 70,
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
  attachmentButton: {
    padding: 8,
    marginRight: 5,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreviewContainer: {
    position: 'relative',
    margin: 10,
    alignSelf: 'flex-start',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#999',
    textAlign: 'center',
    padding: 10,
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
  sendText: {
    fontSize: 16,
    color: 'white',
  }
})