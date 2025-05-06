import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, ActivityIndicator } from "react-native"
import CustomLeftModal from "../../components/CustomLeftModal"
import { LinearGradient } from "expo-linear-gradient"
import * as ImagePicker from 'expo-image-picker'
import { useState } from "react"
import Ionicons from "react-native-vector-icons/Ionicons"
import useStore from '../../state/store'
import { useRouter } from "expo-router"
import { useAppearanceStore } from "../../state/appStore";
import { Image } from "expo-image"

const imageWidth = Dimensions.get('window').width - 30;

export default function CreatePost() {
    const { uploadPhotos } = useStore()
    const router = useRouter()
    const [images, setImages] = useState<{ uri: string, type: string, name: string }[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const { getGradient } = useAppearanceStore()
    const activeColors = getGradient();

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          allowsMultipleSelection: true,
          selectionLimit: 10 - images.length,
          quality: 0.8,
        })
      
        if (!result.canceled) {
            const newImages = result.assets
                .slice(0, 10 - images.length)
                .map(asset => ({
                    uri: asset.uri,
                    type: asset.mimeType || 'image/jpeg',
                    name: `image-${Date.now()}.${getFileExtension(asset.mimeType)}`
                }))
          
            setImages(prev => [...prev, ...newImages])
        }
    }
      
    const getFileExtension = (mimeType?: string) => {
        if (!mimeType) return 'jpg'
            const parts = mimeType.split('/')
            return parts[1] === 'png' ? 'png' : 
                parts[1] === 'gif' ? 'gif' : 'jpg'
    }

    const handleSubmit = async () => {
        setIsLoading(true)
        try {
            const formData = new FormData()
            images.forEach((image, index) => {
                formData.append('images', {
                    uri: image.uri,
                    name: image.name,
                    type: image.type
                } as any)
            })
      
            const res = await uploadPhotos(formData)
            if (res) router.push('/')
            
        } catch (error) {
            console.error('Ошибка:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <CustomLeftModal title="Загрузка фото">
            <LinearGradient colors={activeColors} style={{flex: 1}}>
                {isLoading && (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color="#fff" />
                        <Text style={styles.loaderText}>Публикация фотографий...</Text>
                    </View>
                )}
                <View style={styles.container}>
                    {images.length > 0 ? (
                        <ScrollView style={styles.imageZone}>
                            {
                                images.map((imageUri, index) => (
                                    <View key={index} style={styles.imageWrapper}>
                                        <Image source={{ uri: imageUri.uri }} style={styles.image} />
                                        <TouchableOpacity 
                                            style={styles.deleteButton}
                                            onPress={() => setImages(images.filter((_, i) => i !== index))}
                                        >
                                            <Ionicons name="trash" size={16} color="white" />
                                        </TouchableOpacity>
                                    </View>
                                ))
                            }
                        </ScrollView>
                        ) : (
                            <View style={styles.placeholder}>
                                <Ionicons name="image-outline" size={64} color="#fff" />
                                <Text style={styles.placeholderText}>Добавьте изображения</Text>
                            </View>
                        )}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                            <Ionicons name="image" size={24} color={activeColors[0]} />
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.submitButton} 
                            onPress={handleSubmit}
                            disabled={isLoading}
                        >
                            <Text style={[styles.buttonText, { color: activeColors[0] }]}>Опубликовать</Text>
                        </TouchableOpacity>
                    </View>
                </View>          
            </LinearGradient>
        </CustomLeftModal>
    )
}

const styles = StyleSheet.create({
    container: { 
        flex: 1,
        padding: 15,
    },
    loaderContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    loaderText: {
        color: '#fff',
        marginTop: 10,
        fontSize: 16,
    },
    imageContainer: {
        flexGrow: 0,
        borderRadius: 10,
        marginBottom: 10,
    },
    imageWrapper: {
        position: 'relative',
        marginRight: 10
    },
    buttonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 10,
    },
    imageButton: {
        height: 50,
        borderRadius: 25,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        width: 50
    },
    submitButton: {
        height: 50,
        flex: 1,
        borderRadius: 25,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: '#445b73',
        fontSize: 16,
        fontWeight: 'bold'
    },
    image: {
        width: imageWidth,
        height: imageWidth * 0.7,
        borderRadius: 10,
        marginBottom: 10
    },
    deleteButton: {
        position: 'absolute',
        right: 5,
        top: 5,
        backgroundColor: 'rgba(0,0,0,0.5)',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center'
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 'auto',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        gap: 5
    },
    optionText: {
        color: '#fff',
        fontSize: 14
    },
    inner: {
        flex: 1,
        justifyContent: 'space-between',
    },
    imageZone: {
        flex: 1,
        backgroundColor: "rgba(255,255,255,0.1)",
        borderRadius: 10,
        marginBottom: 10, // отступ до кнопок
    },
    placeholder: {
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
    },
    placeholderText: {
        color: "#fff",
        marginTop: 8,
        fontSize: 16,
    }
})