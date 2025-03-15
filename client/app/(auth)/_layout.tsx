import { Stack } from 'expo-router';

export default function RootLayout() {
    return (
        <Stack>
            <Stack.Screen
                name="login"
                options={{
                    headerShown: false,
                    animation: "fade"
                }}
            />
            <Stack.Screen
                name="register"
                options={{
                    headerShown: false,
                    animation: "fade"
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
    );
}