import { useState, useEffect } from "react"
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import useStore from "../../state/store"
import useAppearanceStore from "../../state/appStore"
import CustomLeftModal from "../../components/CustomLeftModal"

type PrivacyOption = "Все" | "друзья" | "я"

interface PrivacySetting {
  title: string
  value: PrivacyOption
}

export default function PrivacyScreen() {
  const { fetchUserPrivacy, updatePrivacy, setErrorMessage } = useStore()
  const { getGradient } = useAppearanceStore()

  const [privacySettings, setPrivacySettings] = useState<Record<string, PrivacySetting>>({
    avatar: { title: "Кто видит мою фотографию (аватарку)", value: "Все" },
    photos: { title: "Кто видит мои сохранённые фотографии", value: "Все" },
    friends: { title: "Кто видит мой список друзей", value: "Все" },
    posts: { title: "Кто видит все мои посты", value: "Все" }
  })
  const [hasChanges, setHasChanges] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const activeColors = getGradient()

  useEffect(() => {
    const loadPrivacySettings = async () => {
      try {
        setIsLoading(true)
        const serverPrivacy = await fetchUserPrivacy()
        
        setPrivacySettings({
          avatar: { title: "Кто видит мою фотографию (аватарку)", value: serverPrivacy.avatar },
          photos: { title: "Кто видит мои сохранённые фотографии", value: serverPrivacy.photos },
          friends: { title: "Кто видит мой список друзей", value: serverPrivacy.friends },
          posts: { title: "Кто видит все мои посты", value: serverPrivacy.posts }
        })
      } catch (error) {
        setErrorMessage("Ошибка загрузки настроек приватности")
      } finally {
        setIsLoading(false)
      }
    }

    loadPrivacySettings()
  }, [])

  const handlePrivacyChange = (settingKey: string, newValue: PrivacyOption) => {
    setPrivacySettings(prev => ({
      ...prev,
      [settingKey]: {
        ...prev[settingKey],
        value: newValue
      }
    }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    try {
      setIsLoading(true)
      const privacyData = {
        avatar: privacySettings.avatar.value,
        photos: privacySettings.photos.value,
        friends: privacySettings.friends.value,
        posts: privacySettings.posts.value
      }
      
      await updatePrivacy(privacyData)
      setHasChanges(false)
    } catch (error) {
      console.error("Ошибка сохранения настроек:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const PrivacyButton = ({ 
    option, 
    currentValue,
    onPress 
  }: {
    option: PrivacyOption
    currentValue: PrivacyOption
    onPress: () => void
  }) => {
    const isActive = option === currentValue
    
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.privacyButton,
          isActive && styles.privacyButtonActive
        ]}
      >
        <Text style={[
          styles.privacyButtonText,
          isActive && styles.privacyButtonTextActive
        ]}>
          {option}
        </Text>
      </TouchableOpacity>
    )
  }

  if (isLoading) {
    return (
      <CustomLeftModal title="Приватность">
        <View style={[styles.container, styles.loadingContainer]}>
          <LinearGradient colors={activeColors} style={[styles.gradient, { alignItems: 'center', justifyContent: 'center' }]}>
            <ActivityIndicator color="#fff" size="large" />
          </LinearGradient>
        </View>
      </CustomLeftModal>
    )
  }

  return (
    <CustomLeftModal title="Приватность">
      <View style={[styles.container]}>
        <LinearGradient colors={activeColors} style={styles.gradient}>
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.settingBlock]}>
              <Text style={[styles.blockTitle]}>
                Приватность профиля
              </Text>
              
              {Object.entries(privacySettings).map(([key, setting]) => (
                <View key={key} style={styles.privacyRow}>
                  <Text style={[styles.buttonText]}>
                    {setting.title}
                  </Text>
                  <View style={styles.privacyOptions}>
                    {(["Все", "Друзья", "Только я"] as PrivacyOption[]).map((option) => (
                      <PrivacyButton
                        key={option}
                        option={option}
                        currentValue={setting.value}
                        onPress={() => handlePrivacyChange(key, option)}
                      />
                    ))}
                  </View>
                </View>
              ))}

              {hasChanges && (
                <TouchableOpacity 
                  style={styles.saveButton} 
                  onPress={handleSave}
                  disabled={isLoading}
                >
                  <Text style={[styles.saveButtonText, { color: activeColors[0] }]}>
                    {isLoading ? "Сохранение..." : "Сохранить"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </LinearGradient>
      </View>
    </CustomLeftModal>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { 
    flex: 1,
    width: '100%',
  },
  scrollContainer: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 20,
  },
  settingBlock: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    width: "90%",
  },
  blockTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
  },
  privacyRow: {
    marginTop: 16,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    marginBottom: 8,
  },
  privacyOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  privacyButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  privacyButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  privacyButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
  privacyButtonTextActive: {
    fontWeight: "bold",
  },
  saveButton: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  saveButtonText: { 
    fontWeight: "bold" 
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    color: '#fff',
    fontSize: 16
  }
})