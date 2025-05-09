import { useEffect } from "react"
import { View, TouchableOpacity, StyleSheet, Text, Dimensions } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import useStore from "../state/store"
import * as NavigationBar from "expo-navigation-bar"
import useAppearanceStore from "../state/appStore"
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  Easing
} from "react-native-reanimated"
import { Image } from "expo-image"

interface AccountInfo {
  _id?: string
  avatar: string | null
  name: string
  surname: string
  status: "online" | "offline"
  typing: boolean
}

interface CustomHeaderProps {
  showSearch?: boolean
  back?: () => void
  showBack?: boolean
  title?: string
  accountInfo?: AccountInfo
}

const AnimatedView = Animated.createAnimatedComponent(View)

const CustomHeader = ({ showBack = false, showSearch = false, title, back, accountInfo }: CustomHeaderProps) => {
  const { user } = useStore()
  const router = useRouter()
  const screenWidth = Dimensions.get("window").width

  const getGradient = useAppearanceStore(state => state.getGradient)
  const currentTheme = useAppearanceStore(state => state.currentTheme)
  const gradientColors = getGradient()
  
  const backgroundColor = useSharedValue(gradientColors[0])
  
  useEffect(() => {
    backgroundColor.value = withTiming(gradientColors[0], {
      duration: 500,
      easing: Easing.inOut(Easing.ease)
    })
    NavigationBar.setBackgroundColorAsync(gradientColors[0])
    NavigationBar.setButtonStyleAsync("light")
  }, [currentTheme])

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: backgroundColor.value
  }))

  return (
    <AnimatedView style={[styles.headerContainer, animatedStyle]}>
      {showBack ? (
        <TouchableOpacity onPress={() => back ? back() : router.back()} style={styles.button}>
          <Ionicons name="arrow-back" size={30} color="#fff" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={() => router.push(`/profile/${user?.id}`)} style={styles.button}>
          {user?.avatar ? (
            <Image 
              source={{ uri: `${user.avatar}` }} 
              style={styles.avatar} 
              placeholder={{ blurhash: new URL(user.avatar).search.slice(1) }}
            />
          ) : (
            <Ionicons name="person-circle-outline" size={30} color="#fff" />
          )}
        </TouchableOpacity>
      )}

      {accountInfo ? (
        <TouchableOpacity onPress={() => router.push(`/profile/${accountInfo._id}`)} style={styles.accountInfoContainer}>
          <View style={styles.avatarContainer}>
            {accountInfo.avatar ? (
              <Image
                source={{ uri: accountInfo.avatar }}
                style={styles.avatarLarge}
                placeholder={{ blurhash: new URL(accountInfo.avatar).search.slice(1) }}
              />
            ) : (
              <Ionicons name="person-circle-outline" size={36} color="#fff" />
            )}
            <View style={[styles.statusIndicator, { backgroundColor: accountInfo.status === 'online' ? '#4CAF50' : '#757575' }]} />
          </View>
          <View>
            <Text style={styles.accountName}>{accountInfo.name} {accountInfo.surname}</Text>
            <Text style={styles.statusText}>
              {accountInfo.typing ? 'печатает...' : accountInfo.status === 'online' ? 'В сети' : 'Не в сети'}
            </Text>
          </View>
        </TouchableOpacity>
      ) : (
        title && <Text style={styles.headerTitle}>{title}</Text>
      )}

      {showSearch && (
        <TouchableOpacity onPress={() => router.push("/search/secret")} style={styles.button}>
          <Ionicons name="search" size={30} color="#fff" />
        </TouchableOpacity>
      )}

      <View style={[styles.bottomLine, { width: screenWidth * 0.9 }]} />
    </AnimatedView>
  )
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 10,
    paddingHorizontal: 15,
  },
  button: {
    padding: 10,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    flex: 1,
  },
  bottomLine: {
    height: 2,
    backgroundColor: "#fff",
    position: "absolute",
    bottom: 0,
    left: "5%",
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  accountInfoContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarLarge: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  accountName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  statusText: {
    color: "#E0E0E0",
    fontSize: 12,
  },
})

export default CustomHeader