import { useRef, useState, useEffect } from "react"
import { useRouter } from "expo-router"
import { View, ScrollView, StyleSheet, TouchableOpacity, Animated as Anim, Switch, Text } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import useStore from "../../state/store"
import useAppearanceStore, { ThemeKey, themeMap } from "../../state/appStore"
import CustomLeftModal from "../../components/CustomLeftModal"

export default function ApperanceScreen() {
  const router = useRouter()
  const fadeAnim = useRef(new Anim.Value(1)).current
  const { currentTheme, setTheme, showTabText, getGradient, insertLastEmoji, setInsertLastEmoji, musicEnabled, setMusicEnabled, confetti, setConfetti } = useAppearanceStore()
  const setShowTabText = useAppearanceStore(state => state.toggleTabText)
  const [perfomanceTweakCount, setPerformanceTweakCount] = useState(0)
  const [performanceMode, setPerformanceMode] = useState(false)

  const { setErrorMessage } = useStore()

  const handlePerformanceToggle = () => {
    setPerformanceMode(prev => !prev)
    setPerformanceTweakCount(prev => prev + 1)
  }

  useEffect(() => {
    if (perfomanceTweakCount === 1) {
      setErrorMessage("Функции 'улучшить производительность' не существует. Можешь не трогать меня 🙃")
    } else if (perfomanceTweakCount === 5) {
      setErrorMessage("Я серьёзно, не надо...")
    } else if (perfomanceTweakCount === 20) {
      setErrorMessage("Хватит. Я предупреждаю! 😠")
    } else if (perfomanceTweakCount === 40) {
      setErrorMessage("Ты разбудил древнее зло... 👿")
    } else if (perfomanceTweakCount === 60) {
      setErrorMessage("Я не могу это больше терпеть! 😡")
    } else if (perfomanceTweakCount === 80) {
      setErrorMessage("ВСЁ!!! Я СДАЮСЬ! 😤")
    } else if (perfomanceTweakCount == 90 ) {
      router.back()
      setErrorMessage("")
    }
  }, [perfomanceTweakCount])

  const [temporaryGradient, setTemporaryGradient] = useState<readonly [string, string, ...string[]] | null>(null)

  const handleThemeChange = (theme: ThemeKey) => {
    if (theme === currentTheme) return

    const newGradient = themeMap[theme]
    setTemporaryGradient(newGradient)
    
    Anim.sequence([
      Anim.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Anim.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTheme(theme)
      setTemporaryGradient(null)
    })
  }

  const activeColors = temporaryGradient || getGradient()

  return (
    <CustomLeftModal title="Внешний вид">
      <Anim.View style={[styles.container, { opacity: fadeAnim }]}>
        <LinearGradient colors={activeColors} style={styles.gradient}>
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.settingBlock]}>
              <Text style={[styles.blockTitle]}>
                Тема приложения
              </Text>
              <View style={styles.themeButtonsContainer}>
                {Object.keys(themeMap).map((theme) => (
                  <TouchableOpacity
                    key={theme}
                    style={[styles.themeButton, currentTheme === theme && styles.activeThemeButton]}
                    onPress={() => handleThemeChange(theme as ThemeKey)}
                  >
                    <Text style={[styles.buttonThemeText]}>
                      {theme.toUpperCase()}
                    </Text>
                    <View style={styles.colorCircle}>
                      <LinearGradient
                        colors={themeMap[theme as ThemeKey]}
                        style={{ width: '100%', height: '100%', borderRadius: 999, transform: [{ rotate: '-15deg' }] }}
                      />
                    </View>
                  </TouchableOpacity>
                ))}              
              
              </View>
            </View>

            <View style={styles.settingBlock}>
              <Text style={[styles.blockTitle]}>
                Бесполезное
              </Text>
              <View style={styles.toggleRow}>
                <Text style={[styles.buttonText]}>
                  Показывать текст нижних табов
                </Text>
                <Switch 
                  value={showTabText} 
                  onValueChange={setShowTabText} 
                  trackColor={{ false: 'rgba(255,255,255,0.3)', true: "rgba(255,255,255,0.3)" }}
                  thumbColor={showTabText ? '#fff' : '#f4f3f4'}
                />
              </View>
              <View style={styles.toggleRow}>
                <Text style={styles.buttonText}>
                  Улучшить производительность
                </Text>
                <Switch 
                  value={performanceMode}
                  onValueChange={handlePerformanceToggle}
                  trackColor={{ false: 'rgba(255,255,255,0.3)', true: "rgba(255,255,255,0.3)" }}
                  thumbColor={performanceMode ? '#fff' : '#f4f3f4'}
                />
              </View>
              <View style={styles.toggleRow}>
                <Text style={styles.buttonText}>
                  Ставить в конце сообщения рандомный эмодзи
                </Text>
                <Switch 
                  value={insertLastEmoji}
                  onValueChange={setInsertLastEmoji}
                  trackColor={{ false: 'rgba(255,255,255,0.3)', true: "rgba(255,255,255,0.3)" }}
                  thumbColor={performanceMode ? '#fff' : '#f4f3f4'}
                />
              </View>
              <View style={styles.toggleRow}>
                <Text style={styles.buttonText}>
                  Фоновая мелодия
                </Text>
                <Switch 
                  value={musicEnabled}
                  onValueChange={setMusicEnabled}
                  trackColor={{ false: 'rgba(255,255,255,0.3)', true: "rgba(255,255,255,0.3)" }}
                  thumbColor={performanceMode ? '#fff' : '#f4f3f4'}
                />
              </View>
              <View style={styles.toggleRow}>
                <Text style={styles.buttonText}>
                  Конфетти под отправку сообщения с кодовым словом
                </Text>
                <Switch 
                  value={confetti}
                  onValueChange={setConfetti}
                  trackColor={{ false: 'rgba(255,255,255,0.3)', true: "rgba(255,255,255,0.3)" }}
                  thumbColor={performanceMode ? '#fff' : '#f4f3f4'}
                />
              </View>
            </View>
            <View style={styles.bottomSpacer} />
          </ScrollView>
        </LinearGradient>
      </Anim.View>
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
    alignItems: "center",
  },
  blockTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
  },
  colorCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  themeButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    marginTop: 10,
  },
  themeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    flexDirection: 'row',
    gap: 5
  },
  activeThemeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 2,
    borderColor: '#fff',
  },
  sizeButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    marginTop: 10,
  },
  sizeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  activeSizeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 2,
    borderColor: '#fff',
  },
  sizeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  buttonThemeText: {
    color: "#fff",
    fontWeight: "600",
  },
  scaleValue: {
    color: "#fff",
    marginTop: 10,
    fontWeight: "600",
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 12,
    gap: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    flex: 1,
    flexWrap: 'wrap',
  },
  bottomSpacer: {
    height: 20,
  },
})