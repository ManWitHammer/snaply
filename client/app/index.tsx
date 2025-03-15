import { Redirect } from 'expo-router'
import { useAtom } from 'jotai'
import { useEffect, useState } from 'react'
import { isAuthenticatedAtom } from './state/auth'
import useStore from './state/store'

export default function Index() {
	const [isAuthenticated, setIsAuthenticated] = useAtom(isAuthenticatedAtom)
	const [isLoading, setIsLoading] = useState(true)
	const { checkAuth } = useStore()

	useEffect(() => {
		const getData = async () => {
			try {
				setIsLoading(true)
				const isAuthenticatedStatus = await checkAuth()
				if (isAuthenticatedStatus) {
					setIsAuthenticated(true)
				} else {
					setIsAuthenticated(false)
				}
			} catch(err) {
				console.log(err)
			} finally {
				setIsLoading(false)
			}
		}
		getData()
	}, [])

	if (isLoading) {
		return null
	}

	if (isAuthenticated) {
		return <Redirect href='/(app)' />
	} else {
		return <Redirect href='/(auth)' />
	}
}