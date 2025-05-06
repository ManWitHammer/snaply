import { Stack } from 'expo-router'
import useStore from './state/store'
import { StatusBar } from 'expo-status-bar'

export default function RootLayout() {
	const { isAuth } = useStore()

	return (
    <>
      <StatusBar style='light' backgroundColor='transparent' translucent/>
      <Stack>
        <Stack.Screen name='index' options={{ headerShown: false }} />
        {!isAuth ? (
          <Stack.Screen
            name='(auth)'
            options={{
              headerShown: false
            }}
          ></Stack.Screen>
        ) : (
          <Stack.Screen
            name='(app)'
            options={{
              headerShown: false
            }}
          ></Stack.Screen>
        )}
        <Stack.Screen name='+not-found' options={{ title: 'Not Found', headerShown: false }} />
        <Stack.Screen name='not-activate' options={{ title: 'Not Activate', headerShown: false }} />
      </Stack>
    </>
	)
}