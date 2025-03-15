import { useEffect } from "react"
import useStore from "@/state/store"
import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import Feather from "react-native-vector-icons/Feather"

export default function InApiError() {
    const { errorMessage, setErrorMessage } = useStore()

    useEffect(() => {
        if (errorMessage) {
            setTimeout(() => {
                setErrorMessage('')
            }, 5000)
        }
    }, [errorMessage])
    if (!errorMessage) return null
    return (
        <View style={styles.errorContainer}>
            <Feather name="alert-triangle" size={24} color="white" />
            <Text style={styles.error}>{errorMessage}</Text>
            <TouchableOpacity onPress={() => setErrorMessage('')}>
                <Feather name="x" size={24} color="white" />
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    errorContainer: {
        position: "absolute",
        top: 40,
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "red",
        padding: 10,
        borderRadius: 10,
        marginBottom: 10,
        zIndex: 1000,
    },
    error: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
        marginLeft: 10,
        flex: 1,
    },
})