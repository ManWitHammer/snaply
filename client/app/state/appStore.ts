import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Crypto from 'expo-crypto'

export type ThemeKey = 'blue' | 'green' | 'purple' | 'piglet' | 'black' | 'sunset' | 'earth'

export const themeMap: Record<ThemeKey, readonly [string, string, ...string[]]> = {
  blue: ["#445b73", "#749bb8"],
  green: ["#141517", "#6a9113"],
  purple: ["#6a3093", "#a044ff"],
  piglet: ["#ee9ca7", "#ffdde1"],
  black: ["#212121", "#424242"],
  sunset: ["#c02425", "#f0cb35"],
  earth: ["#00c9ff", "#92fe9d"],
}

export const commentColorMap: Record<ThemeKey, string> = {
  blue: '#2c3e50',
  green: '#040700',
  purple: '#3b1463',
  piglet: '#e86a8a',
  black: '#1a1a1a',
  sunset: '#761213',
  earth: '#22a69a',
}

interface AppearanceState {
  currentTheme: ThemeKey
  showTabText: boolean
  passwordHash: string | null
  localLogin: boolean
  biometricLogin: boolean
  insertLastEmoji: boolean
  musicEnabled: boolean
  confetti: boolean

  setTheme: (theme: ThemeKey) => void
  toggleTabText: () => void
  getGradient: () => readonly [string, string, ...string[]]
  getCommentColor: () => string
  getLastEmoji: () => string
  setPassword: (password: string) => Promise<void>
  removePassword: () => void
  setBiometricLogin: (login: boolean) => void
  setLocalLogin: (login: boolean) => void
  setInsertLastEmoji: (insert: boolean) => void
  setMusicEnabled: (enabled: boolean) => void
  setConfetti: (enable: boolean) => void
  cleanAll: () => void
}

const useAppearanceStore = create<AppearanceState>((set, get) => {
  const loadInitialState = async () => {
    try {
      const storedLocalLogin = await AsyncStorage.getItem('localLogin')
      const storedTheme = await AsyncStorage.getItem('currentTheme')
      const storedShowTabText = await AsyncStorage.getItem('showTabText')
      const hash = await AsyncStorage.getItem('app_password_hash')
      const bioLogin = await AsyncStorage.getItem('biometicLogin')
      const insertLastEmoji = await AsyncStorage.getItem('insertLastEmoji')
      const musicEnabled = await AsyncStorage.getItem('musicEnabled')
      const confetti = await AsyncStorage.getItem('confetti')
      
      set({
        passwordHash: hash,
        currentTheme: (storedTheme as ThemeKey) || 'blue',
        showTabText: storedShowTabText ? JSON.parse(storedShowTabText) : true,
        localLogin: storedLocalLogin === "true",
        biometricLogin: bioLogin == "true",
        insertLastEmoji: insertLastEmoji == "true",
        musicEnabled: musicEnabled == "true",
        confetti: confetti == "true"
      })
    } catch (error) {
      console.error('Error loading appearance state:', error)
    }
  }

  loadInitialState()

  return {
    currentTheme: 'blue',
    showTabText: true,
    passwordHash: null,
    localLogin: false,
    biometricLogin: false,
    insertLastEmoji: false,
    musicEnabled: false,
    confetti: false,

    setTheme: async (theme) => {
      set({ currentTheme: theme })
      await AsyncStorage.setItem('currentTheme', theme)
    },
    
    toggleTabText: () => {
      set(state => {
        const newShowTabText = !state.showTabText
        AsyncStorage.setItem('showTabText', JSON.stringify(newShowTabText))
        return { showTabText: newShowTabText }
      })
    },

    getGradient: () => {
      const theme = get().currentTheme
      return themeMap[theme]
    },

    getCommentColor: () => {
      const theme = get().currentTheme
      return commentColorMap[theme]
    },

    getLastEmoji: () => {
      if (get().insertLastEmoji) {
        const allEmojis = [
          '😀', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊', '😋', '😎', '😍', '😘', '🥰',
          '😗', '😙', '😚', '😜', '😝', '😛', '🤑', '🤗', '🤩', '🥳', '😏', '😒', '🙄', '😬', 
          '😪', '😔', '😷', '🤒', '🤕', '🤢', '🤧', '😵', '🤯', '🤠', '😇', '🥺', '😈', '👿', 
          '🤥', '🤭', '🤫', '🤔', '🤨', '😐', '😑', '😶', '😏', '😌', '😒', '🙃', '🧐', '😬',
          '🧐', '🤓'
        ]
        const randomIndex = Math.floor(Math.random() * allEmojis.length)
        return allEmojis[randomIndex]
      }
      return ""
    },
    setPassword: async(password) => {
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        password
      );
      AsyncStorage.setItem('app_password_hash', hash);
      set({ passwordHash: hash });
    },

    removePassword: () => {
      AsyncStorage.removeItem('app_password_hash');
      get().setLocalLogin(false)
      get().setBiometricLogin(false)
      set({ passwordHash: null });
    },

    setBiometricLogin: (login) => {
      AsyncStorage.setItem('biometicLogin', login ? 'true' : 'false');
      set({ biometricLogin: login });
    },

    setLocalLogin: (login) => {
      AsyncStorage.setItem('localLogin', login ? 'true' : 'false');
      set({ localLogin: login });
    },

    setInsertLastEmoji: (insert) => {
      AsyncStorage.setItem('insertLastEmoji', insert ? 'true' : 'false');
      set({ insertLastEmoji: insert });
    },

    setMusicEnabled: (enable) => {
      AsyncStorage.setItem('musicEnabled', enable ? 'true' : 'false');
      set({ musicEnabled: enable });
    },

    setConfetti: (enable) => {
      AsyncStorage.setItem('confetti', enable ? 'true' : 'false')
      set({ confetti: enable })
    },

    cleanAll: () => {
      set({
        showTabText: true,
        passwordHash: null,
        localLogin: false,
        biometricLogin: false,
        insertLastEmoji: false,
        musicEnabled: false,
        confetti: false,
      })
    }
  }
})

export default useAppearanceStore
