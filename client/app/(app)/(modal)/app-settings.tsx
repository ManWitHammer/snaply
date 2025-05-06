import { useState, useRef, useMemo, useCallback } from "react"
import { View, ScrollView, StyleSheet, Switch, Text, Alert, TouchableOpacity } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useAppearanceStore } from "../../state/appStore"
import CustomLeftModal from "../../components/CustomLeftModal"
import PasswordModal from "../../components/PasswordModal"
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet'
import * as LocalAuthentication from 'expo-local-authentication'

export default function ApperanceScreen() {
  const { passwordHash, setPassword, removePassword, getGradient, biometricLogin, setBiometricLogin, localLogin, setLocalLogin } = useAppearanceStore()
  const [isEdit, setIsEdit] = useState(false)
  const [isDelete, setIsDelete] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)

  const activeColors = getGradient()

  const handleBiometricLoginToggle = async (value: boolean) => {
    const isAvailable = await LocalAuthentication.hasHardwareAsync()
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync()
    const isEnrolled = await LocalAuthentication.isEnrolledAsync()
    console.log(isAvailable, supportedTypes, isEnrolled)
       
    if (!isAvailable || supportedTypes.length === 0 || !isEnrolled) {
      Alert.alert('Биометрическая аутентификация недоступна')
      setBiometricLogin(false)
    } else {
      setBiometricLogin(value)
    }
    
  }

  const handlePasswordToggle = (value: boolean) => {
    setLocalLogin(value)
    if(value) {
      console.log(passwordHash)
      if (!passwordHash) {
        setModalVisible(true)
      } else {
        handlePresentModalPress()
      }
    }
  }

  const handleCloseModal = () => {
    if (!isEdit && !isDelete) {
      setLocalLogin(false)
    }
    setModalVisible(false)
    setIsEdit(false)
    setIsDelete(false)
    handleDismissModalPress()
  }

  const handleChangePassword = () => {
    setIsEdit(true)
    setModalVisible(true)
  }

  const handleDisableSecureLogin = () => {
    setIsDelete(true)
    setModalVisible(true)
  }

  const bottomSheetModalRef = useRef<BottomSheetModal>(null)
  const snapPoints = useMemo(() => ['30%', '60%'], [])

  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present()
  }, [])
  
  const handleDismissModalPress = useCallback(() => {
    bottomSheetModalRef.current?.dismiss()
  }, [])

  const handleSubmitPassword = async (input: string) => {
    setIsEdit(false)
    if (isDelete) {
      await removePassword()
      setIsDelete(false)
    } else {
      await setPassword(input)
    }
    setModalVisible(false)
    handleDismissModalPress()
  }

  return (
    <CustomLeftModal title="Приложение" bottomSheetEnable>
      <View style={styles.container}>
        <LinearGradient colors={activeColors} style={styles.gradient}>
          <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.settingBlock}>
              <Text style={styles.blockTitle}>Вход в приложение</Text>
              <View style={styles.toggleRow}>
                <Text style={styles.buttonText}>
                  Код-пароль, отпечаток пальца и распознавание лица
                </Text>
                <Switch 
                  value={!!localLogin} 
                  onValueChange={handlePasswordToggle} 
                  trackColor={{ false: 'rgba(255,255,255,0.3)', true: "rgba(255,255,255,0.3)" }}
                  thumbColor={passwordHash ? '#fff' : '#f4f3f4'}
                />
              </View>
            </View>
          </ScrollView>
          <PasswordModal 
            visible={modalVisible} 
            onClose={handleCloseModal} 
            onSubmit={handleSubmitPassword} 
            isEditable={isEdit}
            isDeletable={isDelete}
          />
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
                      <BottomSheetView style={styles.sheetContent}>
                        <Text style={styles.sheetTitle}>Вход в приложение</Text>
                        <View style={[styles.toggleRow]}>
                          <Text style={styles.buttonText}>
                            Вход по отпечатку пальца или по лицу
                          </Text>
                          <Switch 
                            value={biometricLogin} 
                            onValueChange={handleBiometricLoginToggle} 
                            trackColor={{ false: 'rgba(255,255,255,0.3)', true: "rgba(255,255,255,0.3)" }}
                            thumbColor={biometricLogin ? '#fff' : '#f4f3f4'}
                          />
                        </View>
                        <TouchableOpacity onPress={handleChangePassword} style={styles.toggleRow}>
                          <Text style={styles.buttonText}>Изменить код-пароль</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleDisableSecureLogin} style={styles.toggleRow}>
                          <Text style={styles.buttonText}>Отключить безопасный вход</Text>
                        </TouchableOpacity>
                      </BottomSheetView>
                    </BottomSheetModal>
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
    alignItems: "center",
  },
  blockTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
  },
  themeButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    marginTop: 10,
  },
  sheetContent: {
    flex: 1,
    padding: 20,
  },
  optionButton: {
    paddingVertical: 15,
  },
  optionText: {
    fontSize: 18,
    color: "#111",
  },
  themeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
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
  sheetTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#fff',
  }
})