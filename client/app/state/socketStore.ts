import { io, Socket } from 'socket.io-client'
import { create } from 'zustand'
import { apiUrl } from 'appConfig'
import AsyncStorage from '@react-native-async-storage/async-storage'
import useChatsStore from './chatsStore'
import useStore, { INotification } from './store'

interface SocketStore {
    socket: Socket | null
    initSocket: () => Promise<void>
    disconnectSocket: () => void
}

const useSocketStore = create<SocketStore>((set, get) => ({
    socket: null,
    initSocket: async () => {
        const token = await AsyncStorage.getItem('AuthToken')
        if (!token || get().socket?.connected) return
    
        const newSocket = io(apiUrl, {
          auth: { token },
          transports: ['websocket'],
        })
    
        newSocket.on('connect', () => {
          console.log('Socket connected')
        })

        newSocket.on('newFriendRequest', (data) => {
            const { userDto } = data
            const { setNotifications } = useStore.getState()
        
            const newNotification: INotification = {
                avatar: userDto.avatar,
                name: userDto.name,
                surname: userDto.surname,
                content: "Отправил вам приглашение в друзья",
                path: '/profile/' + userDto.id
            }
            setNotifications([...useStore.getState().notifications, newNotification])
        })
        newSocket.on('friendRequestAccepted', (data) => {
            const { userDto } = data
            const { setNotifications } = useStore.getState()
        
            const newNotification = {
                avatar: userDto.avatar,
                name: userDto.name,
                surname: userDto.surname,
                content: "Принял вашу заявку в друзья",
                path: '/friends'
            }
            setNotifications([...useStore.getState().notifications, newNotification])
        })

        newSocket.on('friendRequestRejected', (data) => {
            const { userDto } = data
            const { setNotifications, user } = useStore.getState()

            if (userDto.id == user?.id) {
                return
            }
            console.log(userDto.id, user?.id)
        
            const newNotification = {
                avatar: userDto.avatar,
                name: userDto.name,
                surname: userDto.surname,
                content: "Отклонил вашу заявку в друзья", 
            }
            setNotifications([...useStore.getState().notifications, newNotification])
        })

        newSocket.on('friendDeleted', (data) => {
            const { userDto } = data
            const { setNotifications } = useStore.getState()

            const newNotification = {
                avatar: userDto.avatar,
                name: userDto.name,
                surname: userDto.surname,
                content: "Удалил вас из друзей",
            }
            setNotifications([...useStore.getState().notifications, newNotification])
        })

        newSocket.on('newMessage', (data) => {
            const { message, chatId, userDto } = data
            const { isUserInChat } = useChatsStore.getState()
            const isReally = isUserInChat(chatId)
            const { setNotifications } = useStore.getState()

            if (!isReally) {
              const newNotification = {
                avatar: userDto.avatar,
                name: userDto.name,
                surname: userDto.surname,
                content: message.content || "Отправлена картинка",
                path: '/chat/' + chatId
              }
              setNotifications([...useStore.getState().notifications, newNotification])
            }
        })
    
        newSocket.on('disconnect', () => {
          console.log('Socket disconnected')
        })
    
        set({ socket: newSocket })
    },
    
    disconnectSocket: () => {
        get().socket?.disconnect()
        set({ socket: null })
    }
}))

export default useSocketStore