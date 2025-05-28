import { useRouter } from "expo-router"
import { useEffect, ReactNode, useLayoutEffect } from "react"
import { StyleSheet, Dimensions, BackHandler, Platform } from "react-native"
import { GestureDetector, Gesture } from "react-native-gesture-handler"
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from "react-native-reanimated"
import { useNavigation  } from "expo-router"
import CustomHeader from "./CustomHeader"
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import InApiError from "./InApiError"
import { StatusBar } from "expo-status-bar"
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const { width } = Dimensions.get("window")

interface AccountInfo {
  _id: string
  avatar: string | null
  name: string
  surname: string
  status: "online" | "offline"
  typing: boolean
}

interface CustomLeftModalProps {
  children: ReactNode
  title?: string
  bottomSheetEnable?: boolean
  accountInfo?: AccountInfo
  height?: number
}

export default function CustomLeftModal({
  children,
  title,
  bottomSheetEnable,
  accountInfo,
  height = Dimensions.get("screen").height,
}: CustomLeftModalProps) {
  const router = useRouter()
  const translateX = useSharedValue(width)
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    })
  }, [navigation])

  useEffect(() => {
    BackHandler.addEventListener('hardwareBackPress', () => {
      closeModal()
      return true
    })

    translateX.value = withTiming(0, { duration: 300 })
  }, [])

  const closeModal = () => {
    translateX.value = withTiming(width, { duration: 300 }, () => {
      runOnJS(router.back)()
    })
  }

  const swipeGesture = Gesture.Pan()
    .activeOffsetX(20)
    .failOffsetX(-5)
    .onUpdate((event) => {
      if (event.translationX > 0) {
        translateX.value = event.translationX
      }
    })
    .onEnd((event) => {
      if (event.translationX > width * 0.4) {
        runOnJS(closeModal)()
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 150 })
      }
    })
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }))

  const containerStyle = [
    styles.modal,
    animatedStyle,
    { 
      height,
      paddingBottom: insets.bottom
    }
  ]

  return (
    <>
      <GestureDetector gesture={swipeGesture}>
        {bottomSheetEnable ? (
          <Animated.View style={containerStyle}>
            <StatusBar style='light' hidden={false}/>
            <BottomSheetModalProvider>
              { Platform.OS === 'ios' && <InApiError style={{ width: width - 40, marginLeft: 20 }}/> }
              <CustomHeader title={title} back={closeModal} accountInfo={accountInfo} showBack/>
              {children}
            </BottomSheetModalProvider>
          </Animated.View>
        ) : (
          <Animated.View style={containerStyle}>
            <StatusBar style='light' hidden={false}/>
            { Platform.OS === 'ios' && <InApiError style={{ width: width - 40, marginLeft: 20 }}/> }
            <CustomHeader title={title} back={closeModal} accountInfo={accountInfo} showBack/>
            {children}
          </Animated.View>
        )}
      </GestureDetector>
    </>
  )
}

const styles = StyleSheet.create({
  modal: {
    backgroundColor: "white",
    overflow: "hidden",
  },
})