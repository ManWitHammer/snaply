import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from "react-native"
import { Stack, useRouter } from "expo-router"
import CustomHeader from "../../components/CustomHeader"
import { LinearGradient } from "expo-linear-gradient"
import useChatsStore, { Chat } from "../../state/chatsStore"
import { useEffect } from "react"
import { Ionicons } from "@expo/vector-icons"
import { formatDistanceToNow } from 'date-fns'
import useAppearanceStore from "../../state/appStore"
import { ru } from 'date-fns/locale'
import { Image } from "expo-image"

export default function ChatScreen() {
  const router = useRouter()
  const { chats, loading, fetchChats } = useChatsStore()
  const { getGradient } = useAppearanceStore()
  const activeColors = getGradient()

  useEffect(() => {
    fetchChats()
  }, [])

  const formatChatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { 
      locale: ru
    })
  }

  const renderChatItem = ({ item }: { item: Chat }) => (
    <TouchableOpacity 
      style={styles.chatItem}
      onPress={() => router.push(`/chat/${item.chatId}`)}
    >
      {/* Аватар */}
      {item.participant?.avatar ? (
        <Image 
          source={{ uri: item.participant.avatar }} 
          style={styles.avatar} 
          placeholder={ item.participant.avatar.startsWith('http') ? { blurhash: new URL(item.participant.avatar).search.slice(1) } : undefined}
        />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person" size={24} color="#fff" />
        </View>
      )}
      
      <View style={styles.chatInfo}>
        <Text style={styles.chatName} numberOfLines={1}>
          {item.participant?.name} {item.participant?.surname}
        </Text>
        
        {item.lastMessage ? (
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage.content}
          </Text>
        ) : (
          <Text style={styles.noMessages}>Нет сообщений</Text>
        )}
      </View>
      
      {item.lastMessage && (
        <Text style={styles.timeAgo}>
          {formatChatTime(item.lastMessage.timestamp)}
        </Text>
      )}
    </TouchableOpacity>
  )

  return (
    <LinearGradient colors={activeColors} style={styles.container}>
      <Stack.Screen options={{ header: () => <CustomHeader title="Чаты"/> }} />
      
      {loading ? (
        <ActivityIndicator size="large" color="#fff" style={styles.loader} />
      ) : chats.length === 0 ? (
        <Text style={styles.noChatsText}>У вас пока нет чатов</Text>
      ) : (
        <FlatList
          data={chats}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.chatId}
          contentContainerStyle={styles.listContent}
        />
      )}
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    marginBottom: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  chatName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    paddingRight: 10,
  },
  lastMessage: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  noMessages: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    fontStyle: 'italic',
  },
  timeAgo: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ff4444',
    textAlign: 'center',
    marginTop: 20,
  },
  noChatsText: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
})