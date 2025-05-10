import React, { useEffect, useState, useMemo } from 'react'
import { View, Text, Share, TouchableOpacity, Alert } from 'react-native'
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetFlatList } from '@gorhom/bottom-sheet'
import NotFound from '../../assets/not-found'
import useChatsStore, { Chat, ChatMessage, ChatParticipant } from '../state/chatsStore'
import { Post } from '../state/postsStore'
import useAppearanceStore from '../state/appStore'
import { useRouter } from "expo-router"
import { Image } from "expo-image"
import Ionicons from '@expo/vector-icons/Ionicons'

interface ShareBottomSheetProps {
  bottomSheetModalRef: React.RefObject<BottomSheetModal | null>
  selectedMessage?: ChatMessage | null
  selectedPost?: Post | null
  otherParticipant: ChatParticipant | undefined
}

const ShareBottomSheet: React.FC<ShareBottomSheetProps> = ({
  bottomSheetModalRef,
  selectedMessage,
  selectedPost,
  otherParticipant
}) => {
  const router = useRouter()
  const { getGradient } = useAppearanceStore() 
  const activeColors = getGradient()
  const snapPoints = useMemo(() => ['40%'], [])
  const { sendMessage, chats, fetchChats } = useChatsStore()
  const [localLoading, setLocalLoading] = useState(false)
  const [localChats, setLocalChats] = useState<Chat[]>([])

  useEffect(() => {
    const loadChats = async () => {
      setLocalChats(chats)
      const fetchedChats = await fetchChats()
      setLocalChats(fetchedChats)
    }

    loadChats()
  }, [fetchChats])

  const onShare = async () => {
    try {
      const content = selectedMessage ? selectedMessage.content : 
        selectedPost ? selectedPost.content : 'Привет😘'
      await Share.share({
        message: content,
      })
    } catch (error: any) {
      Alert.alert(error.message);
    }
  }

  const handleShareToChat = async (chatId: string) => {
    try {
      if (!selectedMessage && !selectedPost) return
      setLocalLoading(true)
      const formData = new FormData()

      if (selectedMessage) {
        if (!selectedMessage.content || !otherParticipant?._id) return
        const message = selectedMessage.content
        const image = selectedMessage.image
        formData.append('message', message)
        if (image) {
          formData.append('imageFromMessage', image)
        }
        formData.append("forwardedFromUser", otherParticipant._id)
      }

      if (selectedPost) {
        const message = selectedPost.content
        formData.append('message', message)
        formData.append("forwardedFromPost", selectedPost._id)
      }

      const res = await sendMessage(chatId, formData)
      if (res.success && bottomSheetModalRef) {
        router.push(`/chat/${chatId}`)
        bottomSheetModalRef.current?.dismiss()
      }
      if (bottomSheetModalRef) {
        bottomSheetModalRef.current?.dismiss()
      }
    } catch (error) {
      console.error('Ошибка при отправке в чат:', error)
    } finally {
      setLocalLoading(false)
    }
  }
  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={0}
      enableDynamicSizing={false}
      snapPoints={snapPoints}
      backgroundStyle={{ backgroundColor: activeColors[0], width: "100%" }}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
        />
      )}
      handleIndicatorStyle={{ backgroundColor: 'white' }}
    >
        <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 16, marginLeft: 16 }}>
          Поделиться
        </Text>
        <View style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
          <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
            Выберите чат
          </Text>
        </View>
        <BottomSheetFlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={localChats.length == 0 ? chats : localChats}
          keyExtractor={(item) => item.chatId}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{ 
                marginHorizontal: 10, 
                alignItems: 'center',
                width: 80
              }}
              onPress={() => handleShareToChat(item.chatId)}
              disabled={localLoading}
            >
              {item.participant.avatar ? (
                <Image 
                  source={{ uri: item.participant.avatar }}
                  style={{ width: 60, height: 60, borderRadius: 30, marginBottom: 8, backgroundColor: 'white' }}
                  placeholder={ item.participant.avatar.startsWith('http') ? { blurhash: new URL(item.participant.avatar).search.slice(1) } : undefined}
                />
              ) : (
                <View
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    marginBottom: 8,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <NotFound width={60} height={60} />
                </View>
              )}
              <Text style={{ color: 'white', textAlign: 'center', fontSize: 12 }} numberOfLines={2}>
                {item.participant.name} {item.participant.surname}
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={{ color: 'white', textAlign: 'center', marginTop: 20 }}>
              У вас нет чатов
            </Text>
          }
          style={{ maxHeight: 100 }}
        /> 
        <View style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
          <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
            Дополнительно
          </Text>
        </View>
        <TouchableOpacity
          style={{ 
            marginHorizontal: 10,  
            alignItems: 'center',
            width: 80
          }}
          onPress={onShare}
          disabled={localLoading}
        >
          <Ionicons name="share-social-outline" size={50} color="white" />
          <Text style={{ color: 'white', textAlign: 'center', fontSize: 12 }} numberOfLines={2}>
            другое
          </Text>
        </TouchableOpacity>
      </BottomSheetModal>
  )
}

export default ShareBottomSheet