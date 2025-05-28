import { create } from 'zustand'
import { apiUrl } from 'appConfig'
import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import useStore from './store'

export interface IUser {
  _id: string
  name: string
  surname: string
  avatar: string | null
}

export interface Comment {
  _id: string
  userId: IUser
  text: string
  createdAt: string
}

export interface Post {
  _id: string
  content: string
  author: IUser
  images: string[]
  likes: string[]
  commentsCount: number
  visibility: string
  commentsEnabled: boolean
  aiGenerated: boolean
  createdAt: string
}

interface SearchData {
  posts: Post[]
  currentPage: number
  totalPages: number
}

interface PostsState {
  posts: Post[]
  loading: boolean
  error: string | null
  currentPage: number
  totalPages: number
  fetchPosts: (page?: number) => Promise<void>
  fetchPost: (postId: string, page?: number) => Promise<{ post: Post, comments: Comment[] }>
  searchPosts: (query: string, page: number) => Promise<SearchData>
  likePost: (postId: string, userId: string) => Promise<boolean>
  addComment: (postId: string, text: string) => Promise<Comment | null>
  fetchComments: (postId: string) => Promise<Comment[]>
  deletePost: (postId: string) => Promise<void>
  editComment: (postId: string, commentId: string, text: string) => Promise<Comment | null>
  deleteComment: (postId: string, commentId: string) => Promise<boolean>
}

const usePostsStore = create<PostsState>((set, get) => ({
    posts: [],
    loading: false,
    error: null,
    currentPage: 1,
    totalPages: 1,

    fetchPosts: async (page = 1) => {
      set({ loading: true, error: null })
      const AuthToken = await AsyncStorage.getItem('AuthToken')
      try {
        const response = await axios.get(`${apiUrl}/api/posts?page=${page}`, {
            headers: {
                Authorization: AuthToken
            }
        })
        set((state) => ({
          posts: page === 1 
            ? response.data.data 
            : [...state.posts, ...response.data.data],
          currentPage: page,
          totalPages: response.data.meta.totalPages
        }))
      } catch (error: any) {
        if (error.response) {
          useStore.getState().setErrorMessage(error.response.data.message)
        } else if (error.request) {
          useStore.getState().setErrorMessage('Нет ответа от сервера')
        } else {
          useStore.getState().setErrorMessage('Непредвиденная ошибка')
        }
      } finally {
        set({ loading: false })
      }
    },

    fetchPost: async (postId, page = 1) => {
      const AuthToken = await AsyncStorage.getItem('AuthToken')
      try {
        const response = await axios.get(`${apiUrl}/api/post/${postId}?page=${page}`, {
          headers: {
            Authorization: AuthToken
          }
        })
        console.log(response.data, postId)
        if (response.data) {
          return response.data
        }
      } catch (error: any) {
        if (error.response) {
          useStore.getState().setErrorMessage(error.response.data.message)
        } else if (error.request) {
          useStore.getState().setErrorMessage('Нет ответа от сервера')
        } else {
          useStore.getState().setErrorMessage('Непредвиденная ошибка')
        }
      }
    },

    searchPosts: async (query: string, page = 1) => {
      set({ loading: true, error: null })
      const AuthToken = await AsyncStorage.getItem('AuthToken')
      try {
        const response = await axios.get(`${apiUrl}/api/posts/search/${query.slice(0,1) == '#' ? query.slice(1) : query}?page=${page}${query.slice(0,1) == '#' ? '&type=hashtag' : ''}`, {
          headers: {
            Authorization: AuthToken
          }
        })
        return {
          posts: response.data.data,
          currentPage: page,
          totalPages: response.data.meta.totalPages
        }
      } catch (error: any) {
        if (error.response) {
          useStore.getState().setErrorMessage(error.response.data.message)
        } else if (error.request) {
          useStore.getState().setErrorMessage('Нет ответа от сервера')
        } else {
          useStore.getState().setErrorMessage('Непредвиденная ошибка')
        }
        return {
          posts: [],
          currentPage: 1,
          totalPages: 1
        }
      } finally {
        set({ loading: false })
      }
    },

    likePost: async (postId, userId) => {
      try {
        const AuthToken = await AsyncStorage.getItem('AuthToken')
        const res = await axios.post(`${apiUrl}/api/post/${postId}/like`, {}, {
            headers: {
                Authorization: AuthToken
            }
        })
        set((state) => {
          const updatedPosts = state.posts.map(post => {
            if (post._id === postId) {
              const likeIndex = post.likes.indexOf(userId)
              return {
                ...post,
                likes: likeIndex === -1 
                  ? [...post.likes, userId]
                  : post.likes.filter(id => id !== userId)
              }
            }
            return post
          })
          return { posts: updatedPosts }
        })
        if (res.data) {
          return true
        } else {
          return false
        }
      } catch (error: any) {
        if (error.response) {
          useStore.getState().setErrorMessage(error.response.data.message)
        } else if (error.request) {
          useStore.getState().setErrorMessage('Нет ответа от сервера')
        } else {
          useStore.getState().setErrorMessage('Непредвиденная ошибка')
        }
        return false
      }
    },

    addComment: async (postId, text) => {
      try {
        const AuthToken = await AsyncStorage.getItem('AuthToken')
        const response = await axios.post(`${apiUrl}/api/post/${postId}/comments`, { text }, {
            headers: {
                Authorization: AuthToken
            }
        })
        if (response.data) {
          return response.data
        } else {
          return null
        }
      } catch (error: any) {
        if (error.response) {
          useStore.getState().setErrorMessage(error.response.data.message)
        } else if (error.request) {
          useStore.getState().setErrorMessage('Нет ответа от сервера')
        } else {
          useStore.getState().setErrorMessage('Непредвиденная ошибка')
        }
      }
    },

    fetchComments: async (postId) => {
      try {
        const AuthToken = await AsyncStorage.getItem('AuthToken')
        const response = await axios.get(`${apiUrl}/api/post/${postId}/comments`, {
            headers: {
                Authorization: AuthToken
            }
        })
        if (response.data) {
          return response.data.data
        } else {
          return []
        }
      } catch (error: any) {
        if (error.response) {
          useStore.getState().setErrorMessage(error.response.data.message)
        } else if (error.request) {
          useStore.getState().setErrorMessage('Нет ответа от сервера')
        } else {
          useStore.getState().setErrorMessage('Непредвиденная ошибка')
        }
        return []
      }
    },

    deletePost: async (postId) => {
        try {
            const AuthToken = await AsyncStorage.getItem('AuthToken')
            await axios.delete(`${apiUrl}/api/post/${postId}`, {
                headers: {
                    Authorization: AuthToken
                }
            })
            set(state => ({
                posts: state.posts.filter(post => post._id !== postId)
            }))
        } catch (error: any) {
          if (error.response) {
            useStore.getState().setErrorMessage(error.response.data.message)
          } else if (error.request) {
            useStore.getState().setErrorMessage('Нет ответа от сервера')
          } else {
            useStore.getState().setErrorMessage('Непредвиденная ошибка')
          }
        }
    },
    editComment: async (postId, commentId, text) => {
      try {
        const AuthToken = await AsyncStorage.getItem('AuthToken')
        const response = await axios.patch(`${apiUrl}/api/post/${postId}/comments/${commentId}`, { text }, {
          headers: {
            Authorization: AuthToken
          }
        })
        if (response.data) {
          return response.data
        } else {
          return null
        }
      } catch (error: any) {
        if (error.response) {
          useStore.getState().setErrorMessage(error.response.data.message)
        } else if (error.request) {
          useStore.getState().setErrorMessage('Нет ответа от сервера')
        } else {
          useStore.getState().setErrorMessage('Непредвиденная ошибка')
        }
        return null
      }
    },
    deleteComment: async (postId, commentId) => {
      try {
        const AuthToken = await AsyncStorage.getItem('AuthToken')
        await axios.delete(`${apiUrl}/api/post/${postId}/comments/${commentId}`, {
          headers: {
            Authorization: AuthToken
          }
        })
        return true
      } catch (error: any) {
        if (error.response) {
          useStore.getState().setErrorMessage(error.response.data.message)
        } else if (error.request) {
          useStore.getState().setErrorMessage('Нет ответа от сервера')
        } else {
          useStore.getState().setErrorMessage('Непредвиденная ошибка')
        }
        return false
      }
    }
}))

export default usePostsStore