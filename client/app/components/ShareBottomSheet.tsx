import React, { useEffect, useState, useMemo } from 'react'
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native'
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet'
import NotFound from '../../assets/not-found'
import { useChatsStore, Chat, ChatMessage, ChatParticipant } from '../state/chatsStore'
import { Post } from '../state/postsStore'
import { useAppearanceStore } from '../state/appStore'
import { useRouter } from "expo-router"

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
  const snapPoints = useMemo(() => ['40%', "60%"], [])
  const { fetchChats, chats, loading, sendMessage } = useChatsStore()
  const [localChats, setLocalChats] = useState<Chat[]>([])
    
  const handleShareToChat = async (chatId: string) => {
    try {
      if (!selectedMessage && !selectedPost) return

      const formData = new FormData()

      if (selectedMessage) {
        if (!selectedMessage.content || !otherParticipant?._id) return
        const message = selectedMessage.content
        formData.append('message', message)
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
    }
  }    
    
  useEffect(() => {
    const loadChats = async () => {
      setLocalChats(chats)
      const fetchedChats = await fetchChats()
      setLocalChats(fetchedChats)
    }

    loadChats()
  }, [fetchChats])

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={0}
      snapPoints={snapPoints}
      backgroundStyle={{ backgroundColor: activeColors[0] }}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
        />
      )}
      handleIndicatorStyle={{ backgroundColor: 'white' }}
    >
      <BottomSheetView style={{ flex: 1, padding: 16 }}>
        <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
          Поделиться постом
        </Text>

        {/* Секция с чатами */}
        <Text style={{ color: 'white', marginBottom: 8 }}>Мои чаты</Text>
        <FlatList
          data={localChats}
          keyExtractor={(item) => item.chatId}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{ padding: 12, flexDirection: 'row', alignItems: 'center' }}
              onPress={() => handleShareToChat(item.chatId)}
            >
              {item.participant.avatar ? (
                <Image
                  source={{ uri: item.participant.avatar }}
                  style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }}
                />
              ) : (
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    marginRight: 12,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <NotFound width={40} height={40} />
                </View>
              )}
              <Text style={{ color: 'white' }}>{item.participant.name} {item.participant.surname}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ color: 'white', textAlign: 'center', marginTop: 20 }}>
                У вас нет чатов
              </Text>
            )
          }
          style={{ maxHeight: 150, marginBottom: 20 }}
        />
      </BottomSheetView>
    </BottomSheetModal>
  )
}

export default ShareBottomSheet