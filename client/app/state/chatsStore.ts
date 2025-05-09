import { create } from 'zustand'
import { apiUrl } from '../../appConfig'
import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface ChatParticipant {
    _id: string
    name: string
    surname: string
    avatar: string | null
}
  
export interface ChatMessage {
    _id: string
    sender: ChatParticipant
    content: string
    image: string
    isEdited: boolean
    isOwnMessage: boolean
    timestamp: string
    forwardedFromPost?: {
        _id: string
        author: ChatParticipant
        images: string[]
    }
    forwardedFromUser?: ChatParticipant
    isTemp?: boolean
}
  
export interface Chat {
    chatId: string
    isGroup: boolean
    lastMessage: ChatMessage | null
    participant: ChatParticipant
}

export interface fetchMessagesDto {
    messages: ChatMessage[]
    hasMore: boolean
    otherParticipant: ChatParticipant & { status: "online" | "offline" }
}

export interface sendMessageDto {
    success: boolean
    messageId?: string
    image?: string
    timestamp?: string
}
  
interface ChatState {
    chats: Chat[]
    currentChatId: string | null;
    loading: boolean
    error: string | null
    setCurrentChatId: (chatId: string | null) => void;
    fetchChats: () => Promise<Chat[]>
    sendMessage: (chatId: string, formData: FormData) => Promise<sendMessageDto>
    fetchMessages: (chatId: string, page: number) => Promise<fetchMessagesDto>
    isUserInChat: (chatId: string) => boolean
    deleteMessage: (chatId: string, messageId: string) => Promise<boolean>;
    editMessage: (chatId: string, messageId: string, newContent: string) => Promise<boolean>
}

const useChatsStore = create<ChatState>((set, get) => ({
    chats: [],
    currentChatId: null,
    loading: false,
    error: null,

    fetchChats: async () => {
        set({ loading: true, error: null })
        const AuthToken = await AsyncStorage.getItem('AuthToken')
        try {
            const response = await axios.get(`${apiUrl}/api/chats`, {
                headers: {
                    Authorization: AuthToken
                }
            })
            if (response.data) {
                set({ chats: response.data })
                return response.data
            }
            return []
        } catch (error) {
            set({ error: 'Ощибка с получением чатов' })
            return []
        } finally {
            set({ loading: false })
        }
    },
    fetchMessages: async (chatId: string, page: number) => {
        const AuthToken = await AsyncStorage.getItem('AuthToken')
        try {
            const response = await axios.get(`${apiUrl}/api/chat/${chatId}?page=${page}`, {
                headers: {
                    Authorization: AuthToken
                }
            })
            if (response.data) {
                return response.data
            }
            return { messages: [], hasMore: false }
        } catch (error) {
            set({ error: 'Ошибка с получением сообщений' })
            return { messages: [], hasMore: false }
        }
    },
    setCurrentChatId: (chatId: string | null) => set({ currentChatId: chatId }),

    isUserInChat: (chatId: string) => {
        return get().currentChatId === chatId;
    },
    sendMessage: async (chatId, formData) => {
        try {
            const token = await AsyncStorage.getItem('AuthToken');
            const response = await axios.post(
                `${apiUrl}/api/chat/${chatId}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: token
                    }
                }
            )
            if (response.data) {
                set({
                    chats: get().chats.map(chat => {
                        if (chat.chatId === chatId) {
                            return {
                                ...chat,
                                lastMessage: response.data
                            };
                        }
                        return chat;
                    })
                })
            }
            
            return {
                success: true,
                messageId: response.data._id,
                image: response.data.image,
                timestamp: response.data.timestamp
            };
        } catch (error) {
          console.error('Send message error:', error);
          return { success: false };
        }
    },
    deleteMessage: async (chatId, messageId) => {
        try {
            const token = await AsyncStorage.getItem('AuthToken');
            const response = await axios.delete(
                `${apiUrl}/api/chat/${chatId}/${messageId}`,
                {
                    headers: {
                        Authorization: token,
                    },
                }
            );
            if (response.data) return true
            else return false
        } catch (error) {
          console.error('Delete message error:', error);
          return false;
        }
    },
    
    editMessage: async (chatId, messageId, newContent) => {
        try {
            const token = await AsyncStorage.getItem('AuthToken');
            const response = await axios.patch(
                `${apiUrl}/api/chat/${chatId}/${messageId}`,
                { message: newContent },
                {
                    headers: {
                        Authorization: token
                    },
                }
            );
            if (response.data) return true
            else return false
        } catch (error) {
          console.error('Edit message error:', error);
          return false;
        }
    },
}))

export default useChatsStore