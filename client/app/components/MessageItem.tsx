import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { format, parseISO } from 'date-fns'
import FormattedText from './FormattedText'
import { ChatMessage } from '../state/chatsStore'
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
const AnimatedImage = Animated.createAnimatedComponent(Image)
const AnimatedView = Animated.createAnimatedComponent(View)

interface MessageItemProps {
  item: ChatMessage
  handleLongPress: (item: ChatMessage, e: any) => void
  setShowOptions: (show: boolean) => void
  commentColor: string
  onImagePress?: (imageUrl: string) => void
}

const MessageItem: React.FC<MessageItemProps> = ({ item, handleLongPress, setShowOptions, commentColor, onImagePress }) => {
  const router = useRouter()
  return (
  <View>
    <Pressable>
      {({ pressed }: { pressed: boolean }) => (
        <>
          {item.content && (
            <Pressable
              onLongPress={(e) => handleLongPress(item, e)}
              onPress={() => setShowOptions(false)}
              delayLongPress={500}
              style={({ pressed }) => [
                styles.messageContainer,
                item.isOwnMessage
                  ? { ...styles.myMessageContainer, backgroundColor: commentColor }
                  : styles.theirMessageContainer,
                item.isTemp && { opacity: 0.7 },
                pressed && { opacity: 0.8 }
              ]}
            >
              <AnimatedView
                entering={FadeInDown} 
                exiting={FadeOutDown}
              >
                {!item.isOwnMessage && (
                  <Text style={styles.senderName}>
                    {item.sender.name} {item.sender.surname}
                  </Text>
                )}

                {item.forwardedFromPost && (
                  <Pressable onPress={() => router.push('/post/' + item?.forwardedFromPost?._id)}>
                    <View
                      style={[
                        styles.forwardedContainer,
                        item.isOwnMessage ? styles.myForwardedContainer : styles.theirForwardedContainer
                      ]}
                    >
                      <View style={styles.forwardedHeader}>
                        <Ionicons name="arrow-redo" size={16} color="#888" />
                        <Text style={styles.forwardedText}>Переслано из поста</Text>
                      </View>
                      <View style={styles.forwardedAuthor}>
                        {item.forwardedFromPost.author.avatar && (
                          <Image
                            source={{ uri: item.forwardedFromPost.author.avatar }}
                            style={styles.forwardedAvatar}
                            placeholder={ item.forwardedFromPost.author.avatar.startsWith('http') ? { blurhash: new URL(item.forwardedFromPost.author.avatar).search.slice(1) } : undefined}
                          />
                        )}
                        <Text style={styles.forwardedAuthorName} numberOfLines={1}>
                          {item.forwardedFromPost.author.name} {item.forwardedFromPost.author.surname}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                )}

                {item.forwardedFromUser && (
                  <Pressable onPress={() => router.push('/profile/' + item?.forwardedFromUser?._id)}>
                    <View
                      style={[
                        styles.forwardedContainer,
                        item.isOwnMessage ? styles.myForwardedContainer : styles.theirForwardedContainer
                      ]}
                    >
                      <View style={styles.forwardedHeader}>
                        <Ionicons name="arrow-redo" size={16} color="#888" />
                        <Text style={styles.forwardedText}>Переслано от пользователя</Text>
                      </View>
                      <View style={styles.forwardedAuthor}>
                        {item.forwardedFromUser.avatar ? (
                          <Image
                            source={{ uri: item.forwardedFromUser.avatar }}
                            style={styles.forwardedAvatar}
                            placeholder={ item.forwardedFromUser.avatar.startsWith('http') ? { blurhash: new URL(item.forwardedFromUser.avatar).search.slice(1) } : undefined}
                          />
                        ) : <Ionicons name="person-circle-outline" size={32} color="#888" />}
                        <Text style={styles.forwardedAuthorName} numberOfLines={1}>
                          {item.forwardedFromUser.name} {item.forwardedFromUser.surname}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                )}

                <View style={styles.messageContentWrapper}>
                  <FormattedText
                    style={item.isOwnMessage ? styles.myMessageContent : styles.theirMessageContent}
                    text={item.content}
                    isPressable
                    color={item.isOwnMessage ? '#fff' : 'black'}
                  />
                  <View style={styles.messageFooter}>
                    <Text style={item.isOwnMessage ? styles.myMessageTime : styles.theirMessageTime}>
                      {format(parseISO(item.timestamp), 'HH:mm')}
                    </Text>
                    {item.isEdited && (
                      <Text
                        style={[
                          item.isOwnMessage ? styles.myMessageTime : styles.theirMessageTime,
                          { fontStyle: 'italic', marginRight: 4 }
                        ]}
                      >
                        (ред.)
                      </Text>
                    )}
                    {item.isOwnMessage && !item.isTemp && (
                      <Text style={styles.statusIcon}>✓</Text>
                    )}
                  </View>
                </View>
              </AnimatedView>
            </Pressable>
          )}
          {(item.image || (item.forwardedFromPost && item.forwardedFromPost?.images?.length > 0)) && (
            <Pressable 
              onPress={() => onImagePress?.(item._id)}
              onLongPress={(e) => handleLongPress(item, e)}
              delayLongPress={500}
            >
              {({ pressed }: { pressed: boolean }) => (
                <AnimatedImage
                  source={{ uri: item.image || item.forwardedFromPost?.images[0] || '' }}
                  style={[
                    styles.messageImage,
                    item.isOwnMessage ? styles.myMessageImage : styles.theirMessageImage,
                    item.isTemp && { opacity: 0.7 },
                    pressed && { opacity: 0.8 }
                  ]}
                  contentFit="cover"
                  placeholder={((item.image || item.forwardedFromPost?.images[0]) && (item.image || item.forwardedFromPost?.images[0])?.startsWith('http')) ? 
                    { blurhash: new URL(item.image || item.forwardedFromPost?.images[0] || '').search.slice(1) } : 
                    undefined}
                />
              )}          
            </Pressable>
          )}
        </>
      )}
    </Pressable>  
  </View>
)}

const styles = StyleSheet.create({
    messageContainer: {
        maxWidth: '80%',
        minWidth: '20%', 
        marginBottom: 8,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    senderName: {
        color: '#555', 
        fontSize: 14, 
        marginBottom: 4,
        fontWeight: 'bold'
      },
    dateHeader: {
        color: '#888',
        fontSize: 12,
        marginBottom: 4,
        alignSelf: 'center'
    },
    messageContentWrapper: {
        flexDirection: 'column', 
    },
    myMessageContainer: {
        alignSelf: 'flex-end',
        borderBottomRightRadius: 2,
    },
    theirMessageContainer: {
        alignSelf: 'flex-start',
        backgroundColor: '#e5e5ea',
        borderBottomLeftRadius: 2,
    },
    myMessageContent: {
        color: '#ecf0f1',
        fontSize: 16,
        flexShrink: 1,
    },
    theirMessageContent: {
        color: 'black',
        fontSize: 16,
        flexShrink: 1,
    },
    messageFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end', 
        alignItems: 'center',
        marginTop: 4,
    },
    myMessageTime: {
        color: 'rgba(236, 240, 241, 0.7)',
        fontSize: 12,
    },
    theirMessageTime: {
        color: 'rgba(0, 0, 0, 0.5)',
        fontSize: 12,
    },
    forwardedContainer: {
        width: "100%",
        paddingBottom: 8,
    },
    myForwardedContainer: {
        width: "100%",
        alignSelf: 'flex-start',
    },
    theirForwardedContainer: {
        alignSelf: 'flex-start',
        marginLeft: 10,
    },
    forwardedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    forwardedText: {
        color: '#888',
        fontSize: 13,
        marginLeft: 4,
    },
    forwardedAuthor: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    forwardedAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 8,
    },
    forwardedAuthorName: {
      color: '#555',
      fontSize: 14,
      fontWeight: '500',
      paddingRight: 55
    },
    statusIcon: {
        fontSize: 12,
        color: 'rgba(236, 240, 241, 0.7)',
        marginLeft: 4,
    },
    messageImage: {
        width: '80%', 
        height: undefined, 
        borderRadius: 10,
        aspectRatio: 1,
        marginBottom: 10,
    },
    myMessageImage: {
        alignSelf: 'flex-end',
        borderTopRightRadius: 0,
    },
    theirMessageImage: {
        alignSelf: 'flex-start',
        borderTopLeftRadius: 0,
    },
})

export default MessageItem