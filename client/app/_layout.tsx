import { Stack } from 'expo-router'
import { useAtom } from 'jotai'
import { isAuthenticatedAtom } from './state/auth'
import { StatusBar } from 'expo-status-bar'

export default function RootLayout() {
	const [isAuthenticated] = useAtom(isAuthenticatedAtom)

	return (
    <>
      <StatusBar style='light' backgroundColor='#445b73' />
      <Stack>
        {!isAuthenticated ? (
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
        <Stack.Screen name='+not-found' options={{ title: 'Not Found' }} />
      </Stack>
    </>
	)
}