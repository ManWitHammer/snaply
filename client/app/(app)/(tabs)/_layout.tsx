import { Tabs } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import useAppearanceStore from "../../state/appStore"
import {
  useSharedValue,
  withTiming,
  Easing
} from "react-native-reanimated"
import { useEffect } from "react"

export default function Layout() {
  const getGradient = useAppearanceStore(state => state.getGradient)
  const showTabText = useAppearanceStore(state => state.showTabText)
  const currentTheme = useAppearanceStore(state => state.currentTheme)
  
  const gradientColors = getGradient()
  const tabBarBackground = useSharedValue(gradientColors[0])

  useEffect(() => {
    tabBarBackground.value = withTiming(gradientColors[0], {
      duration: 500,
      easing: Easing.inOut(Easing.ease)
    })
  }, [currentTheme])

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: gradientColors[0],
          borderTopWidth: 0,
        },
        tabBarActiveTintColor: "#fff",
        tabBarInactiveTintColor: currentTheme == "piglet" || "earth" ? "#dedede" : "#c2c0c0",
        tabBarLabelStyle: {
          fontSize: showTabText ? 12 : 0,
          fontWeight: "bold",
          display: showTabText ? 'flex' : 'none',
        },
        tabBarIconStyle: {
          marginBottom: showTabText ? 0 : -5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Главная",
          tabBarIcon: ({ color, size }) => {
            const iconSize = showTabText ? size : size * 1.35 
            return <Ionicons name="home" size={iconSize} color={color} />
          },
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: "Чаты",
          tabBarIcon: ({ color, size }) => {
            const iconSize = showTabText ? size : size * 1.35
            return <Ionicons name="chatbubbles" size={iconSize} color={color} />
          },
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: "Меню",
          tabBarIcon: ({ color, size }) => {
            const iconSize = showTabText ? size : size * 1.35
            return <Ionicons name="menu" size={iconSize} color={color} />
          },
        }}
      />
    </Tabs>
  )
}