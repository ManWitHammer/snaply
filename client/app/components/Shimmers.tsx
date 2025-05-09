import { View, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated'
import { useEffect } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import useAppearanceStore from '../state/appStore'

export const ProfileShimmer = () => {
    const activeColors = useAppearanceStore().getGradient()
    const router = useRouter()
    const backgroundColor = useSharedValue('#fff')

    const animatedStyle = useAnimatedStyle(() => {
        return {
            backgroundColor: backgroundColor.value,
        }
    })

    useEffect(() => {
        backgroundColor.value = withRepeat(
            withTiming('#D3D3D3', { duration: 800 }),
            -1,
            true
        )
    }, [])

    return (
        <ScrollView style={{flex: 1}}>
            <View style={styles.profileContainer}>
                <View style={[styles.banner, { backgroundColor: activeColors[1] }]}>
                    <TouchableOpacity onPress={() => router.back()} style={[styles.arrowBack, { top: 10 }]}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Animated.View style={[styles.avatarPlaceholder, animatedStyle]} />
                </View>

                <View style={[styles.profileInfo, { backgroundColor: activeColors[0] }]}>
                    <Animated.View style={[styles.profileNameSkeleton, animatedStyle]} />
                    <Animated.View style={[styles.profileDescSkeleton, animatedStyle]} />
                    <Animated.View style={[styles.publishButtonSkeleton, animatedStyle]} />
                </View>
            </View>

            <View style={[styles.mediaContainer, { backgroundColor: activeColors[0] }]}>
                <View style={styles.mediaTabs}>
                    <Animated.View style={[styles.mediaTabSkeleton, animatedStyle]} />
                    <Animated.View style={[styles.mediaTabSkeleton, animatedStyle]} />
                </View>
                <View style={styles.mediaContent}>
                    <Animated.View style={[styles.mediaContentSkeleton, animatedStyle]} />
                    <Animated.View style={[styles.mediaContentSkeleton, animatedStyle]} />
                    <Animated.View style={[styles.mediaContentSkeleton, animatedStyle]} />
                    <Animated.View style={[styles.mediaContentSkeleton, animatedStyle]} />
                    <Animated.View style={[styles.mediaContentSkeleton, animatedStyle]} />
                    <Animated.View style={[styles.mediaContentSkeleton, animatedStyle]} />
                    <Animated.View style={[styles.mediaContentSkeleton, animatedStyle]} />
                    <Animated.View style={[styles.mediaContentSkeleton, animatedStyle]} />
                    <Animated.View style={[styles.mediaContentSkeleton, animatedStyle]} />
                </View>
            </View>
        </ScrollView>
    )
}

export const ChatShimmer = () => {
    const backgroundColor = useSharedValue('#fff')

    const animatedStyle = useAnimatedStyle(() => {
        return {
            backgroundColor: backgroundColor.value,
        }
    })

    useEffect(() => {
        backgroundColor.value = withRepeat(
            withTiming('#D3D3D3', { duration: 800 }),
            -1,
            true
        )
    }, [])

  return (
        <ScrollView 
            style={{flex: 1, paddingHorizontal: 12, paddingTop: 8}}
            contentContainerStyle={{paddingBottom: 20}}
        >
            <Animated.View style={[styles.chatMessageOther, animatedStyle]} />
            <Animated.View style={[styles.chatMessageOtherShort, animatedStyle]} />
            <Animated.View style={[styles.chatMessageOther, animatedStyle]} />
            
            <Animated.View style={[styles.chatMessageSelf, animatedStyle]} />
            <Animated.View style={[styles.chatMessageSelfShort, animatedStyle]} />
            
            <Animated.View style={[styles.chatMessageOther, animatedStyle]} />
            <Animated.View style={[styles.chatMessageOtherShort, animatedStyle]} />
            
            <Animated.View style={[styles.chatMessageSelf, animatedStyle]} />
            <Animated.View style={[styles.chatMessageSelf, animatedStyle]} />
            <Animated.View style={[styles.chatMessageSelfShort, animatedStyle]} />
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    profileContainer: {
        alignItems: 'center',
    },
    banner: {
        position: "relative",
        width: "100%",
        height: 180,
    },
    avatarPlaceholder: {
        zIndex: 1,
        position: "absolute",
        bottom: -50,
        left: Dimensions.get("window").width / 2 - 50,
        width: 100,
        height: 100,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 50, 
    },
    profileInfo: { 
        width: "100%", 
        padding: 20, 
        borderRadius: 10, 
        alignItems: "center",
        paddingTop: 45,
        marginBottom: 10
    },
    arrowBack: {
        position: "absolute",
        left: 10, 
        marginTop: 20,
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        zIndex: 1,
        padding: 5,
        borderRadius: 20
    },
    profileNameSkeleton: {
        width: "60%",
        height: 30,
        borderRadius: 20,
        marginBottom: 10,
        marginTop: 20
    },
    profileDescSkeleton: {
        width: "80%",
        height: 16,
        borderRadius: 20,
        marginBottom: 10,
    },
    publishButtonSkeleton: {
        width: "60%",
        height: 40,
        borderRadius: 20,
        marginTop: 10,
    },  
    mediaTabSkeleton: {
        width: "26%",
        height: 35,
        borderRadius: 15,
        marginBottom: 5,
    },
    mediaContentSkeleton: {
        width: (Dimensions.get('screen').width - 33 - 2) / 3,
        height: 160
    },
    mediaContainer: {
        marginTop: 10,
        borderRadius: 10,
        padding: 15,
        width: '100%',
    },
    mediaTabs: { flexDirection: "row", justifyContent: "space-around", width: "100%", marginBottom: 5 },
    mediaContent: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        width: "100%",
        gap: 2
    },
    chatMessageOther: {
        alignSelf: 'flex-start',
        width: '70%',
        height: 60,
        borderRadius: 12,
        borderTopLeftRadius: 4,
        marginBottom: 8,
    },
    chatMessageOtherShort: {
        alignSelf: 'flex-start',
        width: '50%',
        height: 40,
        borderRadius: 12,
        borderTopLeftRadius: 4,
        marginBottom: 8,
    },
    chatMessageSelf: {
        alignSelf: 'flex-end',
        width: '70%',
        height: 60,
        borderRadius: 12,
        borderTopRightRadius: 4,
        marginBottom: 8,
    },
    chatMessageSelfShort: {
        alignSelf: 'flex-end',
        width: '50%',
        height: 40,
        borderRadius: 12,
        borderTopRightRadius: 4,
        marginBottom: 8,
    },
})