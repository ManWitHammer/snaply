import { View, FlatList, StyleSheet, Text, TouchableOpacity, Pressable } from 'react-native'
import * as Clipboard from "expo-clipboard"
import { Ionicons } from "@expo/vector-icons"
import { useState } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import useStore from '../state/store'
import { Image } from "expo-image"
import NotFound from '../../assets/not-found'
import { useRouter } from 'expo-router'

interface IUser {
  _id: string
  name: string
  surname: string
  avatar: string | null
}

interface Comment {
  _id: string
  userId: IUser
  text: string
  createdAt: string
}

interface CommentsSheetProps {
  comments: Comment[]
  onDeleteComment: (commentId: string) => void
  onEditComment: (comment: Comment) => void
}

const CommentsSheet = ({ 
  comments,
  onDeleteComment,
  onEditComment
}: CommentsSheetProps) => {
  const router = useRouter()
  const [showOptionsFor, setShowOptionsFor] = useState<string | null>(null)
  const { user } = useStore()

  return (
    <View style={styles.container}>
      <FlatList
        data={comments}
        renderItem={({ item }) => {
          const createdDate = new Date(item.createdAt)
          const timeAgo = formatDistanceToNow(createdDate, { addSuffix: true, locale: ru })
          const formattedDate = format(createdDate, 'dd.MM')

          return (
            <View key={item._id} style={{ marginBottom: 12, position: 'relative', overflow: 'visible' }}>
              <TouchableOpacity 
                onLongPress={() => setShowOptionsFor(item._id)} 
                style={styles.commentItem}
              >
                <Pressable onPress={() => router.push(`/profile/${item.userId._id}`)}>
                  {item.userId.avatar ? (
                    <Image
                      source={{ uri: item.userId.avatar }}
                      style={styles.commentAvatar}
                      placeholder={ item.userId.avatar.startsWith('http') ? { blurhash: new URL(item.userId.avatar).search.slice(1) } : undefined}
                    />
                  ) : (
                    <NotFound width={40} height={40} />
                  )}
                </Pressable>
                  
                <View style={styles.commentTextContainer}>
                  <Text style={styles.commentAuthor} numberOfLines={1}>
                    {item.userId.name} {item.userId.surname}
                  </Text>
                  <Text style={styles.commentText}>{item.text}</Text>
                  <Text style={styles.commentDate}>
                    {timeAgo}, {formattedDate}
                  </Text>
                </View>
              </TouchableOpacity>

              {showOptionsFor === item._id && (
                <View style={styles.optionsMenu}>
                  <TouchableOpacity
                    style={styles.optionItem}
                    onPress={() => {
                      Clipboard.setStringAsync(item.text)
                      setShowOptionsFor(null)
                    }}
                  >
                    <Ionicons name="copy-outline" size={18} color="#333" />
                    <Text style={styles.optionText}>Скопировать</Text>
                  </TouchableOpacity>

                  {item.userId._id === user?.id && (
                    <>
                      <TouchableOpacity
                        style={styles.optionItem}
                        onPress={() => {
                          onEditComment(item)
                          setShowOptionsFor(null)
                        }}
                      >
                        <Ionicons name="create-outline" size={18} color="#333" />
                        <Text style={styles.optionText}>Редактировать</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.optionItem}
                        onPress={() => {
                          onDeleteComment(item._id)
                          setShowOptionsFor(null)
                        }}
                      >
                        <Ionicons name="trash-outline" size={18} color="#ff3040" />
                        <Text style={[styles.optionText, { color: '#ff3040' }]}>Удалить</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}
            </View>
          )
        }}
        keyExtractor={(item) => item._id}
        scrollEnabled={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  commentItem: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    padding: 12, 
    borderRadius: 10, 
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  commentTextContainer: { 
    flex: 1,
    marginLeft: 12,
  },
  commentAuthor: { 
    fontWeight: 'bold', 
    marginBottom: 4, 
    color: 'black',
    fontSize: 14,
  },
  commentText: { 
    fontSize: 15, 
    color: 'black',
    marginBottom: 4
  },
  commentDate: {
    fontSize: 11, 
    color: '#333'
  },
  commentAvatar: { 
    width: 40, 
    height: 40, 
    borderRadius: 20,  
    backgroundColor: '#333' 
  },
  optionsMenu: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 100,
    minWidth: 150,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  optionText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
})

export default CommentsSheet