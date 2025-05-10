import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity } from "react-native"
import { useState, useEffect } from "react"
import { useLocalSearchParams } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import CustomLeftModal from "../../../components/CustomLeftModal"
import useAppearanceStore from "../../../state/appStore"
import useStore from "../../../state/store"
import ImageView from '@staltz/react-native-image-viewing'
import AntDesign from "@expo/vector-icons/AntDesign"
import { Image } from "expo-image"

const { width } = Dimensions.get('window')
const PHOTO_SIZE = width / 3 - 10

export default function SharedImagesScreen() {
    const { id } = useLocalSearchParams()
    const { getGradient } = useAppearanceStore()
    const { fetchSharedImages } = useStore()
    const [photos, setPhotos] = useState<string[]>([])
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(false)
    const [total, setTotal] = useState(0)
    const [visible, setIsVisible] = useState(false)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const activeColors = getGradient()

    useEffect(() => {
        const fetchPhotosFromState = async () => {
            setLoading(true)
            const res = await fetchSharedImages(id as string, page)
            setPhotos(res.data)
            setTotal(res.total)
            setLoading(false)
        }
        fetchPhotosFromState()
    }, [page])

    const loadMorePhotos = () => {
        if (!loading && photos.length < total) {
            setPage(prev => prev + 1)
        }
    }

    const renderPhoto = ({ item, index }: { item: string, index: number }) => (
        <TouchableOpacity onPress={() => {
            setCurrentImageIndex(index)
            setIsVisible(true)
        }}>
            <Image
              source={{ uri: item }}
              style={styles.photo}
              placeholder={ item.startsWith('http') ? { blurhash: new URL(item).search.slice(1) } : undefined}
            />
        </TouchableOpacity>
    )

   return (
      <CustomLeftModal title={`Общие фото (${total})`}>
        <LinearGradient colors={activeColors} style={styles.container}>
            <FlatList
                data={photos}
                renderItem={renderPhoto}
                keyExtractor={(item, index) => index.toString()}
                numColumns={3}
                onEndReached={loadMorePhotos}
                onEndReachedThreshold={0.5}
                contentContainerStyle={styles.photoList}
            />
            <ImageView
                images={photos.map(photo => ({ uri: photo }))}
                imageIndex={currentImageIndex}
                visible={visible}
                onRequestClose={() => setIsVisible(false)}
                swipeToCloseEnabled
                doubleTapToZoomEnabled
                HeaderComponent={({ imageIndex }) => (
                    <View style={styles.headerViewer}>
                        <Text style={styles.headerText}>{imageIndex + 1} / {photos.length}</Text>
                        <TouchableOpacity 
                            style={styles.closeButton} 
                            onPress={() => setIsVisible(false)}
                        >
                            <AntDesign name="close" size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                )}
            />
        </LinearGradient>
      </CustomLeftModal>
    )
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
  },
  photoList: {
    alignItems: 'center',
    padding: 1,
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    margin: 1,
  },
  headerViewer: {
    position: 'absolute',
    top: 50,
    width: '100%',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 15,
    top: 0,
    padding: 8,
  },
  headerText: {    color: '#fff',
    fontSize: 16,
  },
})