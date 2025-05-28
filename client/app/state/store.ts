import { create } from 'zustand'
import axios from 'axios'
import { Post } from './postsStore'
import { apiUrl } from 'appConfig'
import AsyncStorage from '@react-native-async-storage/async-storage'
import socketStore from './socketStore'
import useApperanceStore from './appStore'

export interface IErrorUser {
    email?: string
    nickname?: string
    password?: string
    nameAndSurname?: string
}

export interface IUserFromPost {
    _id: string
    nickname: string
    name: string
    surname: string
    avatar: string | null
}

export interface IUser {
    id?: string
    email: string
    nickname: string
    name: string
    surname: string
    password?: string
    avatar: string
    description?: string
}

export interface IProfileDto {
    user: {
        _id: string
        nickname: string
        name: string
        surname: string
        avatar: string
        description: string
        friends: {
            _id: string
            avatar: string
        }[]
        status: "online" | "offline"
        photos: string[]
        friendsCount: number
        isFriend: boolean
        chatId?: string
        sharedImages: string[]
        hasPendingRequest?: boolean
        sentRequest?: boolean
    }
    posts: Post[]
}

export interface INotification {
    avatar: string,
    name: string,
    surname: string,
    content: string,
    path?: string;
}

export interface ISearchDto {
    _id: string
    nickname: string
    name: string
    surname: string
    avatar: string
    friends?: string[]
}

export interface IUserPrivacy {
    avatar: "Все" | "друзья" | "я"
    friends: "Все" | "друзья" | "я"
    posts: "Все" | "друзья" | "я"
    photos:  "Все" | "друзья" | "я"
}

interface IPhotosDto {
    total: number
    page: number
    data: string[]
}

interface FormStore {
    user: IUser | null
    errorMessage: string 
    errors: {
        email?: string
        nickname?: string
        password?: string
        nameAndSurname?: string
    }
    notifications: INotification[]
    isAuth: boolean

    setIsAuth: (auth: boolean) => void
    setField: (field: keyof IUser, value: string) => void
    registration: () => Promise<boolean>
    login: () => Promise<number>
    checkAuth: () => Promise<number>
    logout: () => Promise<boolean>
    validateField: (field: keyof IErrorUser, value: string) => void
    setErrorMessage: (message: string) => void
    setNotifications: (notifications: INotification[]) => void
    setAvatar: (avatar: FormData) => Promise<boolean>
    search: (search: string) => Promise<ISearchDto[]>
    getUser: (id: string, page: number) => Promise<IProfileDto>
    updateUser: (name: string, surname: string, nickname: string, description: string) => Promise<boolean>
    createPost: (formData: FormData) => Promise<boolean>
    uploadPhotos: (formData: FormData) => Promise<boolean>
    sendFriendRequest: (friendId: string) => Promise<boolean>
    getFriends: (page?: number) => Promise<{data: ISearchDto[], hasMore: boolean}>
    getFriendRequests: (page?: number) => Promise<{data: ISearchDto[], hasMore: boolean}>
    getBlockedUsers: (page?: number) => Promise<{data: ISearchDto[], hasMore: boolean}>
    acceptFriendRequest: (friendId: string) => Promise<boolean>
    rejectFriendRequest: (friendId: string, selfReject?: boolean) => Promise<boolean>
    fetchPhotos: (id: string, page: number) => Promise<IPhotosDto>
    deleteFriend: (friendId: string) => Promise<boolean>
    fetchUserPrivacy: () => Promise<IUserPrivacy>
    updatePrivacy: (settings: IUserPrivacy) => Promise<boolean>
    fetchUserFriends: (id: string, page: number) => Promise<IUserFromPost[]>
    fetchSharedImages: (id: string, page: number) => Promise<IPhotosDto>
}

const useStore = create<FormStore>((set, get) => ({
    user: null,
    errorMessage: '',
    errors: {},
    socket: null,
    notifications: [],
    isAuth: false,

    setIsAuth: (auth) => {
        set({ isAuth: auth })
    },
    setField: (field, value) => {
        const user = { ...get().user ?? { email: '', nickname: '', name: '', surname: '', avatar: '' } }
        user[field] = value
        set({ user })
    },
    validateField: (field, value) => {
        const errors = { ...get().errors }
      
        switch (field) {
          case 'email':
            if (!value) {
              errors.email = 'Нужен email'
            } else if (!/\S+@\S+\.\S+/.test(value)) {
              errors.email = 'Неверный формат электронной почты'            
            } else {
              delete errors.email
            }
            break
      
          case 'nickname':
            if (!value) {
              errors.nickname = 'Нужен Никнейм'
            } else if (value.length < 2) {
              errors.nickname = 'Никнейм должен состоять из минимум 2 символов'
            } else if (value.length > 24) {
              errors.nickname = 'Никнейм должен состоять из максимум 24 символов'
            } else if (!/^[a-zA-Z0-9._-]+$/.test(value)) {
              errors.nickname = 'Никнейм может содержать только латинские буквы, цифры, точку, подчеркивание и дефис'
            } else {
              delete errors.nickname
            }
            break      
          case 'password':
            if (!value) {
              errors.password = 'Нужен пароль'
            } else if (value.length < 6) {
              errors.password = 'Пароль должен состоять из минимум 6 символов'
            } else {
              delete errors.password
            }
            break
      
            case 'nameAndSurname':
                const user = get().user ?? { name: '', surname: '' }
                const name = user.name.trim()
                const surname = user.surname.trim()
              
                if (!name || !surname) {
                  errors.nameAndSurname = 'Нужны имя и фамилия'
                } else if (name.length < 2 || surname.length < 2) {
                  errors.nameAndSurname = 'Имя и фамилия должны быть минимум по 2 символа'
                } else if (name.length > 32 || surname.length > 24) {
                  errors.nameAndSurname = 'Имя и фамилия должны быть максимум по 24 символа'
                } else {
                  delete errors.nameAndSurname
                }
                break
      
          default:
            break
        }
      
        set({ errors })
    },

    registration: async () => {
        const { user, validateField } = get()
    
        const requiredFields: (keyof IUser)[] = ['email', 'nickname', 'password']
        let isValid = true
    
        requiredFields.forEach((field) => {
            const value = user?.[field]
            if (!value || value.trim() === '') {
                validateField(field as keyof IErrorUser, '')
                isValid = false
            }
        })
    
        validateField('nameAndSurname', '')
        if (get().errors.nameAndSurname) {
            isValid = false
        }
    
        if (!isValid || Object.keys(get().errors).length > 0) {
            return false
        }
    
        try {
            const res = await axios.post(`${apiUrl}/api/register`, {
                email: user?.email,
                nickname: user?.nickname,
                name: user?.name,
                surname: user?.surname,
                password: user?.password,
            }, { withCredentials: true })
    
            if (res.data) {
                set({ user: res.data.userDto })
                await AsyncStorage.setItem('AuthToken', res.data.refreshToken)
                await socketStore.getState().initSocket()
                return true
            } else {
                return false
            }
        } catch (error: any) {
            if (error.response) {
                set({ errorMessage: error.response.data.message })
            } else if (error.request) {
                set({ errorMessage: 'Нет ответа от сервера' })
            } else {
                set({ errorMessage: 'Непредвиденная ошибка' })
            }
            return false
        }
    },
    setErrorMessage: (message) => set({ errorMessage: message }),

    setNotifications: (notifications: INotification[]) => set({ notifications }),

    login: async () => {
        const { user } = get()

        try {
            const res = await axios.post(`${apiUrl}/api/login`, {
                password: user?.password,
                nickname: user?.nickname,
            }, {withCredentials: true})
            if (res.data && res.data.userDto.isActivated) {
                set({user: res.data.userDto})
                await AsyncStorage.setItem('AuthToken', res.data.refreshToken)
                await socketStore.getState().initSocket()
                return res.status
            } else if (res.data && !res.data.userDto.isActivated) {
                set({user: res.data.userDto})
                await AsyncStorage.setItem('AuthToken', res.data.refreshToken)
                await socketStore.getState().initSocket()
                return 403
            } else return res.status
        } catch(error: any) {
            if (error.response) {
                set({errorMessage: error.response.data.message})
            } else if (error.request) {
                set({errorMessage: 'Нет ответа от сервера'})
            } else {
                set({errorMessage: 'Непредвиденная ошибка'})
            }
            return error.response?.status || 500;
        }
    },
    checkAuth: async () => {
        const { cleanAll } = useApperanceStore.getState()
        try {
            const AuthToken = await AsyncStorage.getItem('AuthToken');
            const response = await axios.get(`${apiUrl}/api/checkauth`, {
                headers: { Authorization: AuthToken }
            });
            if (response.data && response.data.userDto.isActivated) {
                set({ user: response.data.userDto });
                await socketStore.getState().initSocket()
                console.log(response.data)
                return response.status
            } else if (response.data && !response.data.userDto.isActivated) {
                set({ user: response.data.userDto });
                await socketStore.getState().initSocket()
                return 403
            } else return response.status
        } catch (err: any) {
            cleanAll()
            return err.response?.status || 500;
        }
    },
    logout: async () => {
        try {
            const { cleanAll } = useApperanceStore.getState()
            const AuthToken = await AsyncStorage.getItem('AuthToken')
            const res = await axios.get(`${apiUrl}/api/logout`, {
                headers: {
                    Authorization: AuthToken
                }
            })
            if (res.data) {
                set({user: null, isAuth: false})
                socketStore.getState().disconnectSocket()
                await AsyncStorage.removeItem('AuthToken')
                cleanAll()
                return true
            }
            else return false
        } catch(error: any) {
            if (error.response) {
                set({errorMessage: error.response.data.message})
            } else if (error.request) {
                set({errorMessage: 'Нет ответа от сервера'})
            } else {
                set({errorMessage: 'Непредвиденная ошибка'})
            }
            return false
        }
    },
    setAvatar: async (avatar: FormData) => {
        try {
          const AuthToken = await AsyncStorage.getItem('AuthToken')
          const res = await axios.patch(`${apiUrl}/api/user/avatar`, avatar, {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: AuthToken,
            },
          })
          if (res.data) {
            const updatedUser = { 
              ...get().user ?? { email: '', nickname: '', name: '', surname: '' }, 
              avatar: res.data.user
            }
            set({ user: updatedUser })
            return true
          } else {
            return false
          }
        } catch (error: any) {
          if (error.response) {
            set({ errorMessage: error.response.data.message })
          } else if (error.request) {
            set({ errorMessage: 'Нет ответа от сервера' })
          } else {
            set({ errorMessage: 'Непредвиденная ошибка' })
          }
          console.log(error)
          return false
        }
    },
    search: async (search: string) => {
        try {
            const AuthToken = await AsyncStorage.getItem('AuthToken')
            const res = await axios.get(`${apiUrl}/api/search/${search}`, {
                headers: {
                    Authorization: AuthToken
                }
            })
            if (res.data) {
                return res.data
            }
            else return []
        } catch(error: any) {
            if (error.response) {
                return []
            } else if (error.request) {
                return []
            } else {
                return []
            }
        }
    },
    getUser: async (id: string, page: number) => {
        try {
            const AuthToken = await AsyncStorage.getItem('AuthToken')
            const res = await axios.get(`${apiUrl}/api/user/${id}?page=${page}`, {
                headers: {
                    Authorization: AuthToken
                }
            })
            if (res.data) {
                return res.data
            }
            else return null
        } catch (error: any) {
            if (error.response) {
              set({ errorMessage: error.response.data.message })
            } else if (error.request) {
              set({ errorMessage: 'Нет ответа от сервера' })
            } else {
              set({ errorMessage: 'Непредвиденная ошибка' })
            }
            return null
          }
    },
    updateUser: async(name: string, surname: string, nickname: string, description: string) => {
        try {
            const AuthToken = await AsyncStorage.getItem('AuthToken')
            const res = await axios.patch(`${apiUrl}/api/user/info`, {
                name,
                surname,
                nickname,
                description
            }, {
                headers: {
                    Authorization: AuthToken
                }
            })
            if (res.data) {
                const updatedUser = {
                    ...get().user ?? { email: '', nickname: '', name: '', surname: '', avatar: '' },
                    name,
                    surname,
                    nickname,
                    description
                }
                set({ user: updatedUser })
                return true
            }
            else return false
        } catch(error: any) {
            if (error.response) {
                set({ errorMessage: error.response.data.message })
            } else if (error.request) {
                set({ errorMessage: 'Нет ответа от сервера' })
            } else {
                set({ errorMessage: 'Непредвиденная ошибка' })
            }
            return false
        }
    },
    createPost: async (formData: FormData) => {
        try {
            const AuthToken = await AsyncStorage.getItem('AuthToken')
            const {data} = await axios.post(`${apiUrl}/api/posts`, formData, {
                headers: {
                    Authorization: AuthToken,
                    'Content-Type': 'multipart/form-data'
                }
            });
            if (data) return true
            else return false
          
        } catch (error: any) {
            if (error.response) {
                set({ errorMessage: error.response.data.message })
            } else if (error.request) {
                set({ errorMessage: 'Нет ответа от сервера' })
            } else {
                set({ errorMessage: 'Непредвиденная ошибка' })
            }
            return false
        }
    },
    uploadPhotos: async (formData: FormData) => {
        try {
            const AuthToken = await AsyncStorage.getItem('AuthToken')
            const {data} = await axios.post(`${apiUrl}/api/user/photos`, formData, {
                headers: {
                    Authorization: AuthToken,
                    'Content-Type': 'multipart/form-data'
                }
            });
            if (data) return true
            else return false

        } catch (error: any) {
            if (error.response) {
                set({ errorMessage: error.response.data.message })
            } else if (error.request) {
                set({ errorMessage: 'Нет ответа от сервера' })
            } else {
                set({ errorMessage: 'Непредвиденная ошибка' })
            }
            return false
        }
    },
    sendFriendRequest: async (friendId: string) => {
        try {
            const AuthToken = await AsyncStorage.getItem('AuthToken')
            const {data} = await axios.post(`${apiUrl}/api/friends/request/${friendId}`, {}, {
                headers: {
                    Authorization: AuthToken
                }
            })
            if (data) return true
            else return false
          
        } catch (error: any) {
            if (error.response) {
                set({ errorMessage: error.response.data.message })
            } else if (error.request) {
                set({ errorMessage: 'Нет ответа от сервера' })
            } else {
                set({ errorMessage: 'Непредвиденная ошибка' })
            }
            return false
        }
    },
    getFriends: async (page?: number) => {
        try {
            const AuthToken = await AsyncStorage.getItem('AuthToken')
            const { data } = await axios.get(`${apiUrl}/api/friends?page=${page}`, {
                headers: {
                    Authorization: AuthToken
                }
            })
            if (data) {
                return data
            }
            else return []
        } catch(error: any) {
            if (error.response) {
                set({ errorMessage: error.response.data.message })
            } else if (error.request) {
                set({ errorMessage: 'Нет ответа от сервера' })
            } else {
                set({ errorMessage: 'Непредвиденная ошибка' })
            }
            return []
        }
    },
    getFriendRequests: async (page?: number) => {
        try {
            const AuthToken = await AsyncStorage.getItem('AuthToken')
            const { data } = await axios.get(`${apiUrl}/api/friend-requests?page=${page}`, {
                headers: {
                    Authorization: AuthToken
                }
            })
            if (data) {
                return data
            }
            else return []
        } catch(error: any) {
            if (error.response) {
                set({ errorMessage: error.response.data.message })
            } else if (error.request) {
                set({ errorMessage: 'Нет ответа от сервера' })
            } else {
                set({ errorMessage: 'Непредвиденная ошибка' })
            }
            return []
        }
    },
    getBlockedUsers: async (page?: number) => {
        try {
            const AuthToken = await AsyncStorage.getItem('AuthToken')
            const { data } = await axios.get(`${apiUrl}/api/blocked-users?page=${page}`, {
                headers: {
                    Authorization: AuthToken
                }
            })
            if (data) {
                return data
            }
            else return []
        } catch(error: any) {
            if (error.response) {
                set({ errorMessage: error.response.data.message })
            } else if (error.request) {
                set({ errorMessage: 'Нет ответа от сервера' })
            } else {
                set({ errorMessage: 'Непредвиенная ошибка' })
            }
            return []
        }
    },
    acceptFriendRequest: async (friendId: string) => {
        try {
            const AuthToken = await AsyncStorage.getItem('AuthToken')
            const { data } = await axios.post(`${apiUrl}/api/friends/accept/${friendId}`, {}, {
                headers: {
                    Authorization: AuthToken
                }
            })
            if (data) return true
            else return false
        } catch(error: any) {
            if (error.response) {
                set({ errorMessage: error.response.data.message })
            } else if (error.request) {
                set({ errorMessage: 'Нет ответа от сервера' })
            } else {
                set({ errorMessage: 'Непредвиденная ошибка' })
            }
            return false
        }
    },
    rejectFriendRequest: async (friendId: string, selfReject?: boolean) => {
        try {
            const AuthToken = await AsyncStorage.getItem('AuthToken')
            const { data } = await axios.post(`${apiUrl}/api/friends/reject/${friendId}?selfReject=${selfReject}`, {}, {
                headers: {
                    Authorization: AuthToken
                }
            })
            if (data) return true
            else return false
        } catch(error: any) {
            if (error.response) {
                set({ errorMessage: error.response.data.message })
            } else if (error.request) {
                set({ errorMessage: 'Нет ответа от сервера' })
            } else {
                set({ errorMessage: 'Непредвиденная ошибка' })
            }
            return false
        }
    },
    fetchPhotos: async (id: string, page?: number) => {
        try {
            const AuthToken = await AsyncStorage.getItem('AuthToken')
            const { data } = await axios.get(`${apiUrl}/api/photos/${id}?page=${page}`, {
                headers: {
                    Authorization: AuthToken
                }
            })
            if (data) {
                return data
            }
            else return null
        } catch(error: any) {
            if (error.response) {
                set({ errorMessage: error.response.data.message })
            } else if (error.request) {
                set({ errorMessage: 'Нет ответа от сервера' })
            } else {
                set({ errorMessage: 'Непредвиденная ошибка' })
            }
            return null
        }
    },

    deleteFriend: async (friendId: string) => {
        try {
            const AuthToken = await AsyncStorage.getItem('AuthToken')
            const { data } = await axios.delete(`${apiUrl}/api//friends/delete/${friendId}`, {
                headers: {
                    Authorization: AuthToken
                }
            })
            if (data) return true
            else return false
        } catch(error: any) {
            if (error.response) {
                set({ errorMessage: error.response.data.message })
            } else if (error.request) {
                set({ errorMessage: 'Нет ответа от сервера' })
            } else {
                set({ errorMessage: 'Непредвиденная ошибка' })
            }
            return false
        }
    },
    fetchUserPrivacy: async () => {
        try {
            const AuthToken = await AsyncStorage.getItem('AuthToken')
            const { data } = await axios.get(`${apiUrl}/api/user/info/privacy`, {
                headers: {
                    Authorization: AuthToken
                }
            })
            if (data) {
                return data
            }
            else return null
        } catch(error: any) {
            if (error.response) {
                set({ errorMessage: error.response.data.message })
            } else if (error.request) {
                set({ errorMessage: 'Нет ответа от сервера' })
            } else {
                set({ errorMessage: 'Непредвиденная ошибка' })
            }
            return null
        }
    },
    updatePrivacy: async (settings) => {
        try {
            const AuthToken = await AsyncStorage.getItem('AuthToken')
            const { data } = await axios.patch(`${apiUrl}/api/user/info/privacy`, { settings }, {
                headers: {
                    Authorization: AuthToken
                }
            })
            if (data) return true
            else return false
        } catch(error: any) {
            if (error.response) {
                set({ errorMessage: error.response.data.message })
            } else if (error.request) {
                set({ errorMessage: 'Нет ответа от сервера' })
            } else {
                set({ errorMessage: 'Непредвиденная ошибка' })
            }
            return false
        }
    },
    fetchUserFriends: async (id: string, page?: number) => {
        try {
            const AuthToken = await AsyncStorage.getItem('AuthToken')
            const { data } = await axios.get(`${apiUrl}/api/user/info/friends/${id}?page=${page}`, {
                headers: {
                    Authorization: AuthToken
                }
            })
            if (data) {
                return data
            }
            else return null
        } catch(error: any) {
            if (error.response) {
                set({ errorMessage: error.response.data.message })
            } else if (error.request) {
                set({ errorMessage: 'Нет ответа от сервера' })
            } else {
                set({ errorMessage: 'Непредвиденная ошибка' })
            }
            return null
        }
    },
    fetchSharedImages: async (id: string, page?: number) => {
        try {
            const AuthToken = await AsyncStorage.getItem('AuthToken')
            const { data } = await axios.get(`${apiUrl}/api/user/info/sharedImages/${id}?page=${page}`, {
                headers: {
                    Authorization: AuthToken
                }
            })
            if (data) {
                return data
            }
            else return null
        } catch(error: any) {
            if (error.response) {
                set({ errorMessage: error.response.data.message })
            } else if (error.request) {
                set({ errorMessage: 'Нет ответа от сервера' })
            } else {
                set({ errorMessage: 'Непредвиденная ошибка' })
            }
            return null
        }
    }
}))

export default useStore