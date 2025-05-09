import { Redirect } from 'expo-router'
import { useEffect, useState } from 'react'
import useStore from './state/store'
import { Image, StyleSheet, Alert, View, TouchableOpacity, Text } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import useAppearanceStore from './state/appStore'
import * as LocalAuthentication from 'expo-local-authentication'
import * as Crypto from 'expo-crypto'
import { MaterialIcons } from '@expo/vector-icons'

export default function Index() {
	const [isLoading, setIsLoading] = useState(true)
	const [redirectPath, setRedirectPath] = useState<string | null>(null)
	const [pinCode, setPinCode] = useState<string>('')
	const { getGradient, biometricLogin, localLogin, passwordHash } = useAppearanceStore()
	const activeColors = getGradient()
	const { checkAuth, setIsAuth } = useStore()

	const handlePinInput = async (digit: string) => {
		if (pinCode.length < 4) {
			const newPin = pinCode + digit
			setPinCode(newPin)
			
			if (newPin.length === 4) {
				const hashedPassword = await Crypto.digestStringAsync(
					Crypto.CryptoDigestAlgorithm.SHA256,
					newPin
				)
				if (hashedPassword === passwordHash) {
					setIsAuth(true)
					setRedirectPath('/(app)')
				} else {
					Alert.alert('Неверный пароль')
					setPinCode('')
				}
			}
		}
	}

	const handleDeletePin = () => {
		if (pinCode.length > 0) {
			setPinCode(pinCode.slice(0, -1))
		}
	}

	const handleExit = () => {
		Alert.alert(
			"Выход",
			"Вы уверены, что хотите выйти?",
			[
				{
					text: "Отмена",
					style: "cancel"
				},
				{
					text: "Выйти",
					onPress: () => setRedirectPath('/(auth)')
				}
			]
		)
	}

	const handleBiometricAuth = async () => {
		const isAvailable = await LocalAuthentication.hasHardwareAsync()
		const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync()
		const isEnrolled = await LocalAuthentication.isEnrolledAsync()
		console.log(isAvailable, supportedTypes, isEnrolled)
	
		if (!isAvailable || supportedTypes.length === 0 || !isEnrolled) {
			Alert.alert('Биометрическая аутентификация недоступна')
			return
		}
	
		const result = await LocalAuthentication.authenticateAsync({
			promptMessage: 'Подтвердите отпечатком пальца',
			fallbackLabel: 'Введите пароль',
			cancelLabel: 'Отмена',
		})
	
		if (result.success) {
			return true
		} else {
			return false
		}
	}

	useEffect(() => {
		const getData = async () => {
			try {
				setIsLoading(true)
				const status = await checkAuth()
				if (status === 200) {
					if (localLogin && !biometricLogin) {
						setIsLoading(false)
					} else if (localLogin && biometricLogin) {
						const res = await handleBiometricAuth()
						if (res) {
							setIsAuth(true)
							setRedirectPath('/(app)')
						} 
					} else {
						setIsAuth(true)
						setRedirectPath('/(app)')
					}
				} else if (status === 403) {
					setRedirectPath('/not-activate')
				} else {
					setIsLoading(false)
					setRedirectPath('/(auth)')
				}
			} catch (err) {
				console.log(err)
				setIsLoading(false)
				setRedirectPath('/(auth)')
			} finally {
				if (!localLogin || biometricLogin) {
					setIsLoading(false)
				}
			}
		}
		getData()
	}, [])

	if (isLoading && (!localLogin || biometricLogin) && !redirectPath) {
		return (
			<LinearGradient colors={activeColors} style={styles.container}>
				<Image source={require('../assets/icon.png')} style={{width: 200, height: 200}}/>
			</LinearGradient>
		)
	}

	if (localLogin && !redirectPath) {
		return (
			<LinearGradient colors={activeColors} style={styles.container}>
				<View style={styles.pinContainer}>
					<View style={styles.dotsContainer}>
						{[...Array(4)].map((_, index) => (
							<View
								key={index}
								style={[
									styles.dot,
									index < pinCode.length ? styles.dotFilled : null
								]}
							/>
						))}
					</View>
					<View style={styles.keypad}>
						{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
							<TouchableOpacity
								key={number}
								style={styles.key}
								onPress={() => handlePinInput(number.toString())}
							>
								<Text style={styles.keyText}>{number}</Text>
							</TouchableOpacity>
						))}
						<TouchableOpacity
							style={styles.key}
							onPress={handleExit}
						>
							<MaterialIcons name="logout" size={24} color="white" />
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.key}
							onPress={() => handlePinInput('0')}
						>
							<Text style={styles.keyText}>0</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.key}
							onPress={handleDeletePin}
						>
							<MaterialIcons name="backspace" size={24} color="white" />
						</TouchableOpacity>
					</View>
				</View>
			</LinearGradient>
		)
	}

	if (redirectPath) {
		return <Redirect href={redirectPath} />
	}

	return null
}

const styles = StyleSheet.create({
	container: { 
		flex: 1, 
		justifyContent: 'center', 
		alignItems: 'center' 
	},
	text: { 
		fontSize: 20, 
		fontWeight: 'bold', 
		color: 'white' 
	},
	pinContainer: {
		width: '80%',
		alignItems: 'center',
	},
	dotsContainer: {
		flexDirection: 'row',
		marginBottom: 30,
	},
	dot: {
		width: 20,
		height: 20,
		borderRadius: 10,
		backgroundColor: 'rgba(255,255,255,0.3)',
		margin: 5,
	},
	dotFilled: {
		backgroundColor: 'white',
	},
	keypad: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'center',
		width: '100%',
	},
	key: {
		width: '30%',
		height: 70,
		justifyContent: 'center',
		alignItems: 'center',
		margin: 5,
	},
	keyText: {
		fontSize: 24,
		color: 'white',
	},
})