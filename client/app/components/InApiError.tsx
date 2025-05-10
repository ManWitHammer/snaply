import { useEffect, useState } from "react"
import useStore, { INotification } from "@/state/store"
import { View, Text, StyleSheet, TouchableOpacity, Animated, ViewStyle, Dimensions, Pressable } from "react-native"
import Feather from "@expo/vector-icons/Feather"
import NotFound from "assets/not-found"
import { useRouter } from "expo-router"
import { Image } from "expo-image"

type InApiErrorProps = {
    style?: ViewStyle
}

export default function InApiError({ style }: InApiErrorProps) {
    const router = useRouter()
    const { errorMessage, setErrorMessage, notifications, setNotifications } = useStore()
    const [fadeAnim] = useState(new Animated.Value(0))
    const [fadeErrorAnim] = useState(new Animated.Value(0))
    const [progress] = useState(new Animated.Value(100))
    const [errorProgress] = useState(new Animated.Value(100))

    const handleNotificationPress = (notification: INotification) => {
        const newNotifications = notifications.filter(n => n !== notification)
        setNotifications(newNotifications)
        
        if (notification.path) {
            router.push(notification.path)
        }
    }

    useEffect(() => {
        if (errorMessage) {
            errorProgress.setValue(100)

            Animated.parallel([
                Animated.timing(fadeErrorAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(errorProgress, {
                    toValue: 0,
                    duration: 5000,
                    useNativeDriver: false,
                }),
            ]).start()

            const timeout = setTimeout(() => {
                Animated.timing(fadeErrorAnim, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true,
                }).start(() => setErrorMessage(''))
            }, 5000)

            return () => clearTimeout(timeout)
        }
    }, [errorMessage])

    useEffect(() => {
        if (notifications.length > 0) {
            progress.setValue(100)
            fadeAnim.setValue(0)

            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(progress, {
                    toValue: 0,
                    duration: 5000,
                    useNativeDriver: false,
                }),
            ]).start()

            const timeout = setTimeout(() => {
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true,
                })
                .start(() => {
                    setNotifications(notifications.slice(1))
                })
            }, 5000)

            return () => clearTimeout(timeout)
        }
    }, [notifications])

    return (
        <View style={[styles.container, style]}>
            {errorMessage ? (
                <Animated.View style={[styles.errorContainer, { opacity: fadeErrorAnim }]}>
                    <View style={{flex: 1, flexDirection: "row", padding: 10}}>
                        <Feather name="alert-triangle" size={24} color="white" />
                        <Text style={styles.error}>{errorMessage}</Text>
                        <TouchableOpacity onPress={() => {
                            Animated.timing(fadeErrorAnim, {
                                toValue: 0,
                                duration: 300,
                                useNativeDriver: true,
                            }).start(() => setErrorMessage(''))
                        }}>
                            <Feather name="x" size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.progressBarContainer}>
                        <Animated.View
                            style={[
                                styles.progressBar,
                                {
                                    width: errorProgress.interpolate({
                                        inputRange: [0, 100],
                                        outputRange: ["0%", "100%"],
                                    }),
                                    backgroundColor: "#fff",
                                },
                            ]}
                        />
                    </View>
                </Animated.View>
            ) : null}

            {notifications.map((notification, index) => (
                <Pressable onPress={() => handleNotificationPress(notification)} key={index} style={{zIndex: 50, backgroundColor: "#fff", overflow: "hidden", borderRadius: 10}}>
                    <Animated.View style={[styles.notificationContainer, { opacity: fadeAnim }]}>
                        {notification.avatar ? (
                            <Image
                                source={{ uri: notification.avatar }}
                                style={styles.avatar}
                                placeholder={ notification.avatar.startsWith('http') ? { blurhash: new URL(notification.avatar).search.slice(1) } : undefined}
                            />
                        ) : (
                            <NotFound width={40} height={40}/>
                        )}
                        <View style={styles.notificationInfo}>
                            <Text style={styles.nameText}>
                                {notification.name} {notification.surname}
                            </Text>
                            <Text style={styles.contentText} numberOfLines={2}>
                                {notification.content}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => {
                            const newNotifications = [...notifications]
                            newNotifications.splice(index, 1)
                            setNotifications(newNotifications)
                        }}>
                            <Feather name="x" size={24} color="#445b73" />
                        </TouchableOpacity>
                    </Animated.View>
                    <Animated.View style={[styles.progressBarContainer, { opacity: fadeAnim }]}>
                        <Animated.View
                            style={[
                                styles.progressBar,
                                {
                                    width: progress.interpolate({
                                        inputRange: [0, 100],
                                        outputRange: ["0%", "100%"],
                                    }),
                                },
                            ]}
                        />
                    </Animated.View>
                </Pressable>
            ))}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: 40,
        flexDirection: "column",
        width: Dimensions.get("screen").width - 40,
    },
    errorContainer: {
        width: "100%",
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: "#F44336",
        borderRadius: 10,
        marginBottom: 8,
        zIndex: 1000,
        overflow: "hidden"
    },
    notificationContainer: {
        width: "100%",
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: "#fff",
        padding: 10,
        borderRadius: 10,
        gap: 6,
        overflow: "hidden",
        zIndex: 1000,
    },
    notificationInfo: {
        flex: 1,
        flexDirection: "column",
    },
    nameText: {
        color: "#000",
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 2,
    },
    contentText: {
        color: "#445b73",
        fontSize: 14,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    notificationText: {
        color: "#445b73",
        fontSize: 16,
        fontWeight: "bold",
        marginLeft: 10,
        flex: 1,
    },
    progressBarContainer: {
        height: 5,
        width: "100%",
        marginTop: 5,
        position: "absolute",
        bottom: 0,
        left: 0,
    },
    progressBar: {
        height: "100%",
        borderBottomLeftRadius: 10,
        backgroundColor: "#445b73", 
    },
    error: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
        marginLeft: 10,
        flex: 1,
    },
})