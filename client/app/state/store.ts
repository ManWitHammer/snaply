import { create } from 'zustand'
import axios from 'axios'
import { apiUrl } from 'appConfig'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface IUser {
    id?: string
    email: string
    nickname: string
    name: string
    surname: string
    password?: string
    avatar?: string
}

interface FormStore {
    user: IUser | null
    errorMessage: string 
    errors: {
        email?: string
        nickname?: string
        password?: string
        name?: string
        surname?: string
    }
    setField: (field: keyof IUser, value: string) => void
    registration: () => Promise<boolean>
    login: () => Promise<boolean>
    checkAuth: () => Promise<boolean>
    validateField: (field: keyof IUser, value: string) => void
    setErrorMessage: (message: string) => void
    setAvatar: (avatar: FormData) => Promise<boolean>
}

const useStore = create<FormStore>((set, get) => ({
    user: null,
    errorMessage: '',
    errors: {},

    setField: (field, value) => {
        const user = { ...get().user ?? { email: '', nickname: '', name: '', surname: '' } }
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
                    errors.email = 'Invalid email format'
                } else {
                    delete errors.email
                }
                break

            case 'nickname':
                if (!value) {
                    errors.nickname = 'Нужен Никнейм'
                } else if (value.length < 2) {
                    errors.nickname = 'Никнейм должен состоять из минимум 2 символов'
                } else if (value.length > 32) {
                    errors.nickname = 'Никнейм должен состоять из максимум 32 символов'
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

            case 'name':
                if (!value) {
                    errors.name = 'Нужно имя'
                } else if (value.length > 32) {
                    errors.name = 'имя должен состоять из максимум 32 символов'
                } else if (value.length < 2) {
                    errors.name = 'имя должен состоять из минимум 2 символов'
                } else {
                    delete errors.name
                }
                break

            case 'surname':
                if (!value) {
                    errors.surname = 'Нужна фамилия'
                } else if (value.length > 32) {
                    errors.surname = 'фамилия должен состоять из максимум 32 символов'
                } else if (value.length < 2) {
                    errors.surname = 'фамилия должен состоять из минимум 2 символов'
                } else {
                    delete errors.surname
                }
                break

            default:
                break
        }

        set({ errors })
    },

    registration: async () => {
        const { user, validateField } = get()

        const requiredFields: (keyof IUser)[] = ['email', 'nickname', 'password', 'name', 'surname']
        let isValid = true

        requiredFields.forEach((field) => {
            const value = user?.[field]
            if (!value || value.trim() === '') {
            validateField(field, '')
            isValid = false
            }
        })

        // Если есть ошибки, возвращаем false
        if (!isValid || Object.keys(get().errors).length > 0) {
            return false
        }

        if (Object.keys(get().errors).length == 0) {
            try {
                const res = await axios.post(`${apiUrl}/api/register`, {
                    email: user?.email,
                    nickname: user?.nickname,
                    name: user?.name,
                    surname: user?.surname,
                    password: user?.password,
                }, {withCredentials: true})

                if (res.data) {
                    set({user: res.data.userDto})
                    await AsyncStorage.setItem('AuthToken', res.data.refreshToken)
                    return true
                }
                else return false
            } catch (error: any) {
                if (error.response) {
                    set({errorMessage: error.response.data.message})
                } else if (error.request) {
                    set({errorMessage: 'Нет ответа от сервера'})
                } else {
                    set({errorMessage: 'Непредвиденная ошибка'})
                }
                return false
            }
        } else {
            return false
        }
    },    
    setErrorMessage: (message) => set({ errorMessage: message }),

    login: async () => {
        const { user } = get()

        try {
            const res = await axios.post(`${apiUrl}/api/login`, {
                password: user?.password,
                nickname: user?.nickname,
            }, {withCredentials: true})
            if (res.data) {
                set({user: res.data.userDto})
                await AsyncStorage.setItem('AuthToken', res.data.refreshToken)
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
    checkAuth: async () => {
		try {
            const AuthToken = await AsyncStorage.getItem('AuthToken')
			const { data } = await axios.get(`${apiUrl}/api/checkauth`, {
				headers: {
                    Authorization: AuthToken
                }
			})
			if (data) {
                console.log(data)
                set({user: data.userDto})
				return true
			} 
            else return false
		} catch (err: any) {
			return false
		}
	},
    setAvatar: async (avatar: FormData) => {
        try {
          const AuthToken = await AsyncStorage.getItem('AuthToken');
          const res = await axios.post(`${apiUrl}/api/setavatar`, avatar, {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: AuthToken,
            },
          });
          if (res.data) {
            const updatedUser = { 
              ...get().user ?? { email: '', nickname: '', name: '', surname: '' }, 
              avatar: res.data.user
            };
            set({ user: updatedUser });
            return true;
          } else {
            return false;
          }
        } catch (error: any) {
          if (error.response) {
            set({ errorMessage: error.response.data.message });
          } else if (error.request) {
            console.log(error.request)
            set({ errorMessage: 'Нет ответа от сервера' });
          } else {
            set({ errorMessage: 'Непредвиденная ошибка' });
          }
          console.log(error)
          return false;
        }
      },
}))

export default useStore