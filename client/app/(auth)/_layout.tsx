import { Stack } from 'expo-router'
import { View, Dimensions } from 'react-native'
import InApiError from "../components/InApiError"
import { StatusBar } from 'expo-status-bar'

export default function RootLayout() {
    return (
        <View style={{flex: 1}}>
            <StatusBar style='light' hidden={false} />
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