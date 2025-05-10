import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Platform, ActionSheetIOS, Modal, Switch, Keyboard, ActivityIndicator, KeyboardAvoidingView } from "react-native"
import CustomLeftModal from "../../components/CustomLeftModal"
import { LinearGradient } from "expo-linear-gradient"
import * as ImagePicker from 'expo-image-picker'
import { useState, useRef, useMemo, useCallback, useEffect } from "react"
import Ionicons from "@expo/vector-icons/Ionicons"
import useStore from '../../state/store'
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet'
import { useRouter } from "expo-router"
import FormattedText from "../../components/FormattedText"
import useAppearanceStore from "../../state/appStore"
import { Image } from "expo-image"

export default function CreatePost() {
    const { createPost } = useStore()
    const router = useRouter()
    const [text, setText] = useState('')
    const [images, setImages] = useState<{ uri: string, type: string, name: string }[]>([])
    const [visibility, setVisibility] = useState('Все')
    const [commentsEnabled, setCommentsEnabled] = useState(true)
    const [aiGenerated, setAiGenerated] = useState(false)
    const [modalVisible, setModalVisible] = useState(false)
    const [currentOptions, setCurrentOptions] = useState<{ options: string[], onSelect: (value: string) => void }>({ options: [], onSelect: () => {} })
    const [isLoading, setIsLoading] = useState(false)
    const [showPreview, setShowPreview] = useState(false)
    const [keyboardVisible, setKeyboardVisible] = useState(false)
    const { getGradient } = useAppearanceStore()
    const activeColors = getGradient()

    useEffect(() => {
        const showSub = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true))
        const hideSub = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false))
          
        return () => {
          showSub.remove()
          hideSub.remove()
        }
      }, [])

    const bottomSheetModalRef = useRef<BottomSheetModal>(null)
    
    const snapPoints = useMemo(() => ['33%'], [])
    
    const handlePresentModalPress = useCallback(() => {
        bottomSheetModalRef.current?.present()
    }, [])
    
    const handleDismissModalPress = useCallback(() => {
        bottomSheetModalRef.current?.dismiss()
    }, [])

    const handlePublishPress = () => {
        handlePresentModalPress()
    }

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          allowsMultipleSelection: true,
          selectionLimit: 5 - images.length,
          quality: 0.8,
        })
      
        if (!result.canceled) {
            const newImages = result.assets
                .slice(0, 5 - images.length)
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

    const showOptions = (options: string[], onSelect: (value: string) => void) => {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['Отмена', ...options],
                    cancelButtonIndex: 0,
                },
                (buttonIndex) => {
                    if (buttonIndex > 0) {
                        onSelect(options[buttonIndex - 1])
                    }
                }
            )
        } else {
            setCurrentOptions({ options, onSelect })
            setModalVisible(true)
        }
    }

    const handleSubmit = async () => {
        setIsLoading(true)
        try {
            const formData = new FormData()

            const content = text.trim().replace(/\n{2,}/g, '\n\n')
            
            formData.append('text', content)
            formData.append('options', JSON.stringify({
                visibility,
                commentsEnabled,
                aiGenerated
            }))
            images.forEach((image, index) => {
                formData.append('images', {
                    uri: image.uri,
                    name: image.name,
                    type: image.type
                } as any)
            })
      
            const res = await createPost(formData)
            if (res) router.push('/')
            
        } catch (error) {
            console.error('Ошибка:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <CustomLeftModal title="Новый пост" bottomSheetEnable>
            <LinearGradient colors={activeColors} style={{flex: 1}}>
                {isLoading && (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color="#fff" />
                        <Text style={styles.loaderText}>Публикация поста...</Text>
                    </View>
                )}
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={"padding"}
                    keyboardVerticalOffset={100}
                    enabled={keyboardVisible}
                >
                    <ScrollView 
                        style={styles.container} 
                        contentContainerStyle={{flexGrow: 1}}
                        keyboardShouldPersistTaps="handled"
                    >
                        {text.length > 1200 && (
                            <Text style={styles.warn}>Превышен лимит в 1200 символов</Text>
                        )}
                        
                        {images.length > 0 && (
                            <ScrollView horizontal style={styles.imageContainer}>
                                {images.map((imageUri, index) => (
                                    <View key={index} style={styles.imageWrapper}>
                                    <Image source={{ uri: imageUri.uri }} style={styles.image} />
                                    <TouchableOpacity 
                                        style={styles.deleteButton}
                                        onPress={() => setImages(images.filter((_, i) => i !== index))}
                                    >
                                        <Ionicons name="trash" size={16} color="white" />
                                    </TouchableOpacity>
                                    </View>
                                ))}
                            </ScrollView>
                        )}

                        {showPreview ? (
                            <View style={styles.previewContainer}>
                                <FormattedText text={text.trim().replace(/\n{2,}/g, '\n\n') || ""} color="#fff" />
                            </View>
                        ) : (
                            <View style={styles.textInputContainer}>
                                <TextInput
                                    style={styles.textArea}
                                    multiline
                                    placeholderTextColor="rgba(255,255,255,0.7)"
                                    placeholder="Введите текст поста..."
                                    value={text}
                                    onChangeText={setText}
                                />
                            </View>
                        )}

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                                <Ionicons name="image" size={24} color={activeColors[0]} />
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.previewButton} 
                                onPress={() => setShowPreview(!showPreview)}
                            >
                                <Ionicons 
                                    name={showPreview ? "create-outline" : "eye-outline"} 
                                    size={24} 
                                    color={activeColors[0]}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.imageButton} onPress={handlePublishPress}>
                                <Ionicons name="options" size={24} color={activeColors[0]} />
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.submitButton} 
                                onPress={handleSubmit}
                                disabled={isLoading}
                            >
                                <Text style={[styles.buttonText, {color: activeColors[0]}]}>Опубликовать</Text>
                            </TouchableOpacity>
                        </View>

                        <BottomSheetModal
                            ref={bottomSheetModalRef}
                            index={0}
                            snapPoints={snapPoints}
                            backdropComponent={(props) => (
                                <BottomSheetBackdrop
                                    {...props}
                                    disappearsOnIndex={-1}
                                    appearsOnIndex={0}
                                />
                            )}
                            backgroundStyle={{ backgroundColor: activeColors[0] }}
                            handleIndicatorStyle={{ 
                                backgroundColor: 'white'
                            }}
                        >
                            <BottomSheetView style={styles.bottomSheetContent}>
                                <View style={styles.header}>
                                    <Text style={styles.headerTitle}>Параметры</Text>
                                    <TouchableOpacity onPress={handleDismissModalPress}>
                                        <Ionicons name="close" size={24} color="white" />
                                    </TouchableOpacity>
                                </View>
                                
                                <View style={styles.bottomSheetItem}>
                                    <Ionicons name="eye" size={24} color="white" />
                                    <Text style={styles.bottomSheetText}>Кто увидит сообщение</Text>
                                    <TouchableOpacity 
                                        style={styles.optionButton}
                                        onPress={() => showOptions(['Все', 'Друзья', 'Только я'], setVisibility)}
                                    >
                                        <Text style={styles.optionText}>{visibility}</Text>
                                        <Ionicons name="chevron-down" size={16} color="white" />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.bottomSheetItem}>
                                    <Ionicons name="chatbubble-outline" size={24} color="white" />
                                    <Text style={styles.bottomSheetText}>Комментарии к посту</Text>
                                    <Switch
                                        value={commentsEnabled}
                                        onValueChange={setCommentsEnabled}
                                        trackColor={{ false: 'rgba(255,255,255,0.3)', true: activeColors[1] }}
                                        thumbColor={commentsEnabled ? '#fff' : '#f4f3f4'}
                                    />
                                </View>
                                <View style={styles.bottomSheetItem}>
                                    <Ionicons name="color-palette-outline" size={24} color="white" />
                                    <Text style={styles.bottomSheetText}>Отметка "Generated By AI"</Text>
                                    <Switch
                                        value={aiGenerated}
                                        onValueChange={setAiGenerated}
                                        trackColor={{ false: 'rgba(255,255,255,0.3)', true: activeColors[1] }}
                                        thumbColor={aiGenerated ? '#fff' : '#f4f3f4'}
                                    />
                                </View>
                            </BottomSheetView>                    
                        </BottomSheetModal>

                        <Modal
                            animationType="fade"
                            transparent
                            visible={modalVisible}
                            onRequestClose={() => setModalVisible(false)}
                        >
                            <View style={styles.modalContainer}>
                                <View style={[styles.modalContent, { backgroundColor: activeColors[0] }]}>
                                    <Text style={styles.modalTitle}>Выберите опцию</Text>
                                    {currentOptions.options.map((option, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={styles.modalOption}
                                            onPress={() => {
                                                currentOptions.onSelect(option)
                                                setModalVisible(false)
                                            }}
                                        >
                                            <Text style={styles.optionText}>{option}</Text>
                                        </TouchableOpacity>
                                    ))}
                                    <TouchableOpacity
                                        style={[styles.modalOption]}
                                        onPress={() => setModalVisible(false)}
                                    >
                                        <Text style={styles.optionText}>Отмена</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Modal>
                    </ScrollView>  
                </KeyboardAvoidingView>        
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
    textInputContainer: {
        marginVertical: 6,
        flex: 1,
        width: '100%',
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        borderRadius: 10,
    },
    textArea: {
        flex: 1,
        width: '100%',
        padding: 16,
        fontSize: 16,
        color: "white",
        textAlignVertical: 'top'
    },
    previewContainer: {
        flex: 1,
        width: '100%',
        padding: 16,
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        borderRadius: 10,
        marginVertical: 6,
    },
    previewToggle: {
        alignSelf: 'flex-end',
        padding: 8,
        marginBottom: 5,
    },
    previewToggleText: {
        color: 'white',
        textDecorationLine: 'underline',
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
    previewButton: {
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
        fontSize: 16,
        fontWeight: 'bold'
    },
    image: {
        width: 200,
        height: 200,
        borderRadius: 10
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 16,
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.2)'
    },
    headerTitle: {
        color: "#fff",
        fontSize: 22,
        fontWeight: "bold",
        flex: 1,
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
    bottomSheetContent: {
        padding: 20,
    },
    bottomSheetItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        gap: 10,
        height: 60
    },
    bottomSheetText: {
        color: '#fff',
        fontSize: 16,
        flex: 1
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20
    },
    modalTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center'
    },
    modalOption: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)'
    },
    warn: {
        color: "white",
        fontSize: 22,
        textAlign: "center"
    }
})