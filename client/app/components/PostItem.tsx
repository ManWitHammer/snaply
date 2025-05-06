import { View, Text, TouchableOpacity, StyleSheet, Dimensions, FlatList, Pressable, NativeSyntheticEvent, TextLayoutEventData } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useRef, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import * as MediaLibrary from 'expo-media-library'
import * as FileSystem from 'expo-file-system'
import ImageView from '@staltz/react-native-image-viewing'
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import FormattedText from './FormattedText'
import { Image } from "expo-image"
import { LinearGradient } from "expo-linear-gradient"
import * as Clipboard from "expo-clipboard"
import OptionsMenu from './OptionsMenu'
import ShareBottomSheet from './ShareBottomSheet'
import { Post } from '../state/postsStore'
import NotFound from 'assets/not-found'

interface Option {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    action: () => void | Promise<void>;
    color?: string;
}

const { width } = Dimensions.get('window')

export default function PostItem({ post, onLike, isLiked, onDelete, currentUserId, commentPressable = false }: { 
  post: Post, 
  onLike: (postId: string) => void, 
  isLiked: boolean,
  onDelete: (postId: string) => void,
  currentUserId: string | undefined,
  commentPressable?: boolean
}) {
    const router = useRouter()
    const [currentIndex, setCurrentIndex] = useState(0)
    const [showOptions, setShowOptions] = useState(false)
    const [isSaving, setIsSaving] = useState(false);
    const [visible, setIsVisible] = useState(false);
    const imagesRef = useRef<FlatList>(null)
    const bottomSheetModalRef = useRef<BottomSheetModal>(null);

    const scrollToIndex = (index: number) => {
        imagesRef.current?.scrollToIndex({ index, animated: true })
        setCurrentIndex(index)
    }

    const [expanded, setExpanded] = useState(false);
    const [shouldShowExpandButton, setShouldShowExpandButton] = useState(false)
    const [measured, setMeasured] = useState(false);

    const handleTextLayout = (e: NativeSyntheticEvent<TextLayoutEventData>) => {
      if (measured) return;
      const { lines } = e.nativeEvent;
      if (lines.length > 3) {
        setShouldShowExpandButton(true);
      } else {
        setShouldShowExpandButton(false);
      }

      setMeasured(true);
    };

    const openBottomSheet = async () => {
      bottomSheetModalRef.current?.present()
    }

    const formatPostTime = (dateString: string) => {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true,
        locale: ru 
      })
    }

    const handleDelete = () => {
        setShowOptions(false)
        onDelete(post._id)
    }

    const saveToGallery = async (index?: number) => {
        if (!index) index = currentIndex
        setShowOptions(false)
        setIsSaving(true)
        
        try {
        // Запрашиваем разрешение
            const { status } = await MediaLibrary.requestPermissionsAsync()
            if (status !== 'granted') {
                return
        }

        const imageUri = post.images[index]
        
        const downloadResult = await FileSystem.downloadAsync(
            imageUri,
            FileSystem.documentDirectory + `image_${Date.now()}.jpg`
        )

        await MediaLibrary.saveToLibraryAsync(downloadResult.uri)
        
        } catch (error) {
            console.error('Ошибка сохранения:', error)
        } finally {
            setIsSaving(false)
        }
    }

    const options = [
      ...(post.author._id === currentUserId
        ? [{
            label: 'Удалить',
            icon: 'trash-outline' as keyof typeof Ionicons.glyphMap,
            action: () => handleDelete(),
            color: '#ff3040',
          }]
        : []),
      ...(post.images.length > 0
        ? [{
            label: isSaving ? 'Сохранение...' : 'Сохранить в галерею',
            icon: isSaving ? 'cloud-download' : 'download-outline',
            action: (index: number) => saveToGallery(index)
          }]
        : []),
      {
        label: 'Копировать текст',
        icon: 'copy-outline',
        action: () => Clipboard.setStringAsync(post.content),
      }
    ] as Option[]

  return (
    <View style={styles.postContainer}>
      {/* Шапка поста */}
      <View style={styles.postHeader}>
        <TouchableOpacity 
          style={{flexDirection: 'row', flex: 1}} 
          onPress={() => router.push(`/profile/${post.author._id}`)}
        > 
          {post.author.avatar ? (
            <Image 
              source={{ uri: post.author.avatar }} 
              style={styles.avatar} 
              placeholder={{ blurhash: post.author.avatar?.split("?")[1]}}
            />
          ) : <NotFound width={40} height={40}/>}
          
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{post.author.name} {post.author.surname}{post.aiGenerated && " <-- 🤖"}</Text>
            <Text style={styles.postTime}>
              {formatPostTime(post.createdAt)}
            </Text>
          </View>
        </TouchableOpacity>
        
        <View style={{ position: 'relative' }}>
          <TouchableOpacity 
            style={styles.moreButton}
            onPress={() => setShowOptions(!showOptions)}
          >
            <Ionicons 
              name="ellipsis-horizontal" 
              size={20} 
              color="#666" 
            />
          </TouchableOpacity>
          
          <OptionsMenu
            visible={showOptions}
            options={options}
            onClose={() => setShowOptions(false)}
            customStyle={styles.optionsMenu}
          />
        </View>
      </View>
      
      {/* Текст поста */}
      {post.content && (
        <View style={{ position: 'relative' }}>
          <FormattedText
            style={styles.postText}
            text={post.content}
            isPressable
            numberOfLines={measured && !expanded ? 3 : undefined}
            onTextLayout={handleTextLayout}
            selectable
          />
    
          {!expanded && shouldShowExpandButton && (
            <Pressable
              onPress={() => setExpanded(true)}
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                height: 35,
                width: 200,
                justifyContent: 'flex-end',
                alignItems: 'flex-end',
              }}
            >
              {/* Полупрозрачная тень справа */}
              <LinearGradient
                colors={['transparent', 'white', "white", "white"]}
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  bottom: 0,
                  width: '100%',
                }}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
    
              <Text style={{
                fontSize: 14,
                fontWeight: 'bold',
                color: '#007AFF',
                margin: 8,
              }}>
                Показать ещё
              </Text>
            </Pressable>
          )}
        </View>
      )}
      
      {/* Карусель изображений */}
      {post.images.length > 0 && (
        <View style={styles.carouselContainer}>
          <FlatList
            ref={imagesRef}
            data={post.images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const contentOffset = e.nativeEvent.contentOffset.x;
              const viewSize = e.nativeEvent.layoutMeasurement.width;
              const newIndex = Math.round(contentOffset / viewSize);
              setCurrentIndex(newIndex);
            }}
            renderItem={({ item }) => (
                <TouchableOpacity 
                    activeOpacity={0.9}
                    onPress={() => setIsVisible(true)}
                >
                    <Image 
                        source={{ uri: item }} 
                        style={styles.postImage} 
                        placeholder={{ blurhash: item.split("?")[1] }}
                        contentFit="cover"
                    />
                </TouchableOpacity>
            )}
            keyExtractor={(_, index: number) => index.toString()}
          />
          
          {/* Индикаторы слайдов */}
          {post.images.length > 1 && (
            <View style={styles.indicatorContainer}>
              {post.images.map((_: string, index: number) => (
                <TouchableOpacity 
                  key={index}
                  style={[
                    styles.indicator,
                    index === currentIndex && styles.activeIndicator
                  ]}
                  onPress={() => scrollToIndex(index)}
                />
              ))}
            </View>
          )}
        </View>
      )}
      
      {/* Действия */}
      <View style={styles.postActions}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => onLike(post._id)}
        >
          <Ionicons 
            name={isLiked ? "heart" : "heart-outline"} 
            size={24} 
            color={isLiked ? "#ff3040" : "#333"} 
          />
          <Text style={styles.actionText}>{post.likes.length}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push(`/post/${post._id}`)}
        >
          <Ionicons name="chatbubble-outline" size={22} color="#333" />
          {post.commentsEnabled && (
            <Text style={styles.actionText}>{post.commentsCount}</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={openBottomSheet}
        >
          <Ionicons name="share-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Оверлей для закрытия меню по тапу вне его */}
      {showOptions && (
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={() => setShowOptions(false)}
          activeOpacity={1}
        />
      )}
      <ImageView
        images={post.images.map((el: string) => ({uri: el}))}
        imageIndex={0}
        visible={visible}
        onRequestClose={() => setIsVisible(false)}
        backgroundColor="rgba(0,0,0,0.9)"
        swipeToCloseEnabled
        doubleTapToZoomEnabled
        HeaderComponent={({ imageIndex }) => (
          <View style={styles.headerViewer}>
            <Text style={styles.headerText}>{imageIndex + 1} / {post.images.length}</Text>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setIsVisible(false)}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
        )}
        FooterComponent={({ imageIndex }) => (
          <View style={styles.footerViewer}>
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={() => saveToGallery(imageIndex)}
            >
              <Ionicons name="download" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      />
      <ShareBottomSheet
        bottomSheetModalRef={bottomSheetModalRef}
        selectedPost={post}
        otherParticipant={post.author}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  headerViewer: {
    position: 'absolute',
    top: 50,
    width: '100%',
    alignItems: 'center',
  },
  headerText: {
    color: '#fff',
    fontSize: 16,
  },
  footerViewer: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 12,
    borderRadius: 30,
  },
  closeButton: {
    position: 'absolute',
    right: 15,
    top: 0,
    padding: 8,
  },
  optionsMenu: {
    position: 'absolute',
    right: 0,
    top: 30,
  },
  postContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginHorizontal: 8,
    marginTop: 10
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontWeight: '600',
    fontSize: 15,
  },
  postTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  moreButton: {
    padding: 4,
  },
  postText: {
    paddingTop: 4,
    paddingHorizontal: 12,
    paddingBottom: 12,
    fontSize: 15,
    lineHeight: 20,
    color: '#333',
  },
  carouselContainer: {
    position: 'relative',
  },
  postImage: {
    width: width - 16,
    height: width * 0.9,
    backgroundColor: '#f5f5f5',
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#fff',
    width: 16,
  },
  postActions: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#333',
  },
})