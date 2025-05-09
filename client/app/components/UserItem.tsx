import { View, Text, Pressable, StyleSheet, TouchableOpacity } from "react-native"
import { useRouter } from "expo-router"
import { Image } from "expo-image"
import NotFound from "../../assets/not-found"
import Ionicons from "@expo/vector-icons/Ionicons"

interface UserListItemProps {
  item: {
    _id: string
    avatar: string | null
    name: string
    surname: string
    nickname: string
    friends?: string[]
  }
  requests?: boolean
  handleAccept?: (userId: string) => Promise<void>
  handleReject?: (userId: string) => Promise<void>
}

function UserListItem({ item, requests, handleAccept, handleReject }: UserListItemProps) {
  const router = useRouter()

  return (
    <Pressable onPress={() => router.push(`/profile/${item._id}`)}>
      <View style={styles.userItem}>
        {item.avatar ? (
          <Image
            source={{ uri: item.avatar }}
            style={styles.avatarPlaceholder}
            placeholder={{ blurhash: new URL(item.avatar).search.slice(1) }}
          />
        ) : (
          <NotFound width={40} height={40} />
        )}
        <View>
          <Text style={styles.userName}>{item.name} {item.surname}</Text>
          <Text style={styles.userDetails}>
            {item.nickname}, {item.friends ? `${item.friends.length} друзей` : ''}
          </Text>
        </View>
        {requests && handleAccept && handleReject && (
            <View style={styles.actionsContainer}>
                <TouchableOpacity 
                    style={styles.acceptButton}
                    onPress={() => handleAccept(item._id)}
                >
                    <Ionicons name="checkmark" size={24} color="#445b73" />
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.rejectButton}
                    onPress={() => handleReject(item._id)}
                >
                    <Ionicons name="close" size={24} color="#F44336" />
                </TouchableOpacity>
            </View>
        )}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 10,
    marginBottom: 10,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#444",
    marginRight: 10,
  },
  userName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  userDetails: {
    color: "#bbb",
    fontSize: 14,
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 10,
  },
  acceptButton: {
    backgroundColor: "#fff",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  rejectButton: {
    backgroundColor: "#fff",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  }
})

export default UserListItem