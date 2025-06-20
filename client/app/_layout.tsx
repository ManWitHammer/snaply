import { Stack } from 'expo-router'

export default function RootLayout() {
	return (
    <Stack>
      <Stack.Screen name='index' options={{ headerShown: false }} />
      <Stack.Screen name='(auth)' options={{ headerShown: false }} />
      <Stack.Screen name='(app)' options={{ headerShown: false }} />
      <Stack.Screen name='+not-found' options={{ title: 'Not Found', headerShown: false }} />
      <Stack.Screen name='not-activate' options={{ title: 'Not Activate', headerShown: false }} />
    </Stack>
	)
}