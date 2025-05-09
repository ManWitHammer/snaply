import { Stack } from 'expo-router'
import * as NavigationBar from "expo-navigation-bar"
import { useEffect } from "react"
import { Dimensions } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import InApiError from "../components/InApiError"
import { StatusBar } from 'expo-status-bar'
import useAppearanceStore from '../state/appStore'
import BackgroundMusicPlayer from '../hooks/useBackgroundMusic'

export default function RootLayout() {
  const { getGradient } = useAppearanceStore()
  const activeColors = getGradient()
  useEffect(() => {
    NavigationBar.setBackgroundColorAsync(activeColors[0])
    NavigationBar.setButtonStyleAsync("light")
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: activeColors[0] }}>
      <StatusBar style="light" />
      <BackgroundMusicPlayer />
      <BottomSheetModalProvider>
        <InApiError style={{ width: Dimensions.get("window").width - 40, marginLeft: 20 }} />
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="(modal)/chat/[id]" 
            options={{ 
              presentation: 'transparentModal',
              headerShown: false,
              gestureEnabled: true,
              gestureDirection: 'horizontal',
              animation: 'fade',
            }} 
          />
          <Stack.Screen 
            name="(modal)/photos/[id]" 
            options={{ 
              presentation: 'transparentModal',
              headerShown: false,
              gestureEnabled: true,
              gestureDirection: 'horizontal',
              animation: 'fade',
            }} 
          />
          <Stack.Screen 
            name="(modal)/post/[id]" 
            options={{ 
              presentation: 'transparentModal',
              headerShown: false,
              gestureEnabled: true,
              gestureDirection: 'horizontal',
              animation: 'fade',
            }} 
          />
          <Stack.Screen 
            name="(modal)/profile/[id]" 
            options={{ 
              presentation: 'modal',
              headerShown: false,
              animation: 'simple_push'
            }} 
          />
          <Stack.Screen 
            name="(modal)/search/[prompt]" 
            options={{ 
              presentation: 'transparentModal',
              headerShown: false,
              gestureEnabled: true,
              gestureDirection: 'horizontal',
              animation: 'fade',
            }} 
          />
          <Stack.Screen 
            name="(modal)/account" 
            options={{ 
              presentation: 'transparentModal',
              headerShown: false,
              gestureEnabled: true,
              gestureDirection: 'horizontal',
              animation: 'fade',
            }} 
          />
          <Stack.Screen 
            name="(modal)/appearance" 
            options={{ 
              presentation: 'transparentModal',
              headerShown: false,
              gestureEnabled: true,
              gestureDirection: 'horizontal',
              animation: 'fade',
            }} 
          />
          <Stack.Screen 
            name="(modal)/create-post" 
            options={{ 
              presentation: 'transparentModal',
              headerShown: false,
              gestureEnabled: true,
              gestureDirection: 'horizontal',
              animation: 'fade',
            }} 
          />
          <Stack.Screen 
            name="(modal)/friends" 
            options={{ 
              presentation: 'transparentModal',
              headerShown: false,
              gestureEnabled: true,
              gestureDirection: 'horizontal',
              animation: 'fade',
            }} 
          />
          <Stack.Screen 
            name="(modal)/privacy" 
            options={{ 
              presentation: 'transparentModal',
              headerShown: false,
              gestureEnabled: true,
              gestureDirection: 'horizontal',
              animation: 'fade',
            }} 
          />
          <Stack.Screen 
            name="(modal)/upload-photo" 
            options={{ 
              presentation: 'transparentModal',
              headerShown: false,
              gestureEnabled: true,
              gestureDirection: 'horizontal',
              animation: 'fade',
            }} 
          />
          <Stack.Screen 
            name="(modal)/app-settings" 
            options={{ 
              presentation: 'transparentModal',
              headerShown: false,
              gestureEnabled: true,
              gestureDirection: 'horizontal',
              animation: 'fade',
            }} 
          />
          <Stack.Screen 
            name="(modal)/friends/[id]" 
            options={{ 
              presentation: 'transparentModal',
              headerShown: false,
              gestureEnabled: true,
              gestureDirection: 'horizontal',
              animation: 'fade',
            }} 
          />
          <Stack.Screen 
            name="(modal)/sharedImages/[id]" 
            options={{ 
              presentation: 'transparentModal',
              headerShown: false,
              gestureEnabled: true,
              gestureDirection: 'horizontal',
              animation: 'fade',
            }} 
          />
        </Stack>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  )
}