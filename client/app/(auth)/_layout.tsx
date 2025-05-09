import { Stack } from 'expo-router'
import { View, Dimensions } from 'react-native'
import InApiError from "../components/InApiError"
import * as NavigationBar from "expo-navigation-bar"
import { useEffect } from "react"
import useAppearanceStore from '../state/appStore'

export default function RootLayout() {
    const { getGradient } = useAppearanceStore()
    const activeColors = getGradient()
    useEffect(() => {
        NavigationBar.setBackgroundColorAsync(activeColors[1])
        NavigationBar.setButtonStyleAsync("light")
      }, [])
    return (
        <View style={{flex: 1}}>
            <InApiError style={{width: Dimensions.get("window").width - 40, marginLeft: 20}}/>
            <Stack>
                <Stack.Screen
                    name="login"
                    options={{
                        headerShown: false,
                        animation: "flip"
                    }}
                />
                <Stack.Screen
                    name="register"
                    options={{
                        headerShown: false,
                        animation: "flip"
                    }}
                />
                <Stack.Screen
                    name="index"
                    options={{
                        headerShown: false,
                        animation: "fade" 
                    }}
                />
            </Stack>
        </View>
        
    )
}