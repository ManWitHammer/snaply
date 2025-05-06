import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import useStore from './state/store';

export default function NotActivateScreen() {
    const { user, logout, socket, setIsAuth } = useStore();
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const handleActivation = (data: any) => {
            console.log('Account activated received:', data);
            router.replace('/')
        };

        socket?.on('accountActivated', handleActivation);

        return () => {
            socket?.off('accountActivated', handleActivation);
        };
    }, [socket])

    const openMailClient = () => {
        if (user?.email) {
            Linking.openURL(`mailto:${user.email}`);
        }
    };

    const handleLogout = async () => {
        try {
            setIsLoading(true);
            const res = await logout();
            if (res) {
                router.replace('/(auth)');
                setIsAuth(false);
            }
        } catch (err) {
            console.log(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <LinearGradient colors={['#445b73', '#749bb8']} style={styles.container}>
            <Text style={styles.text}>Ваш аккаунт не активирован</Text>
            <Text style={styles.subText}>
                Проверьте почту {user?.email} и активируйте аккаунт.
            </Text>

            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={openMailClient}>
                    <Text style={styles.buttonText}>Открыть почту</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    {isLoading ? (
                        <ActivityIndicator color='#fff' />
                    ) : (
                        <Text style={[styles.buttonText, { color: "#fff" }]}>Выйти</Text>
                    )}
                </TouchableOpacity>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    text: { fontSize: 20, fontWeight: 'bold', color: 'white', marginBottom: 10 },
    subText: { fontSize: 16, color: 'white', textAlign: 'center' },
    buttonContainer: {
        flexDirection: 'row', 
        justifyContent: 'center', 
        marginTop: 20, 
    },
    button: {
        padding: 10,
        borderRadius: 15,
        backgroundColor: 'white',
        marginRight: 10, 
    },
    logoutButton: {
        padding: 10,
        backgroundColor: '#e74c3c',
        borderRadius: 15,
    },
    buttonText: { fontSize: 16, color: '#445b73', textAlign: 'center' },
});