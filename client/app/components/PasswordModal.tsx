import { useState } from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useAppearanceStore } from "../state/appStore";
import * as Crypto from 'expo-crypto'

interface PasswordModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
  isEditable?: boolean;
  isDeletable?: boolean;
}

export default function PasswordModal({ visible, onClose, onSubmit, isEditable = false, isDeletable = false }: PasswordModalProps) {
  const [password, setPassword] = useState("");
  const [firstPassword, setFirstPassword] = useState("");
  const [isConfirmation, setIsConfirmation] = useState(false);
  const [step, setStep] = useState<'current' | 'new' | 'confirm'>('current');
  const { passwordHash, getGradient } = useAppearanceStore()
  const activeColors = getGradient();

  const handleClose = () => {
    onClose();
    setPassword("");
    setFirstPassword("");
    setIsConfirmation(false);
    setStep('current');
  }

  const handlePress = async (num: string) => {
    if (password.length < 4) {
      const newPassword = password + num;
      setPassword(newPassword);
      if (newPassword.length === 4) {
          if (isDeletable) {
            const hashedPassword = await Crypto.digestStringAsync(
              Crypto.CryptoDigestAlgorithm.SHA256,
              newPassword
            );
            if (hashedPassword === passwordHash) {
              onSubmit(newPassword);
              setPassword("");
            } else {
              setPassword("");
            }
          } else if (isEditable) {
            if (step === 'current') {
              const hashedPassword = await Crypto.digestStringAsync(
                Crypto.CryptoDigestAlgorithm.SHA256,
                newPassword
              );
              if (hashedPassword === passwordHash) {
                setPassword("");
                setStep('new');
              } else {
                setPassword("");
              }
            } else if (step === 'new') {
              setFirstPassword(newPassword);
              setPassword("");
              setStep('confirm');
            } else {
              if (newPassword === firstPassword) {
                onSubmit(newPassword);
                setPassword("");
                setFirstPassword("");
                setIsConfirmation(false);
                setStep('current');
              } else {
                setPassword("");
              }
            }
          } else {
            if (!isConfirmation) {
              setFirstPassword(newPassword);
              setPassword("");
              setIsConfirmation(true);
            } else {
              if (newPassword === firstPassword) {
                onSubmit(newPassword);
                setPassword("");
                setFirstPassword("");
                setIsConfirmation(false);
              } else {
                setPassword("");
                setIsConfirmation(true);
              }
            }
          }
      }
    }
  };

  const handleDelete = () => {
    if (password.length > 0) {
      setPassword(password.slice(0, -1));
    }
  };

  const getTitle = () => {
    if (isDeletable) {
      return "Введите текущий код-пароль";
    }
    if (isEditable) {
      switch (step) {
        case 'current':
          return "Введите текущий код-пароль";
        case 'new':
          return "Введите новый код-пароль";
        case 'confirm':
          return "Повторите новый код-пароль";
      }
    }
    return isConfirmation ? "Повторите код-пароль" : "Введите новый код-пароль";
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: activeColors[0] }]}>
          <Text style={styles.title}>{getTitle()}</Text>

          <View style={styles.dotsContainer}>
            {Array.from({ length: 4 }).map((_, index) => (
              <View key={index} style={[styles.dot, password.length > index && styles.activeDot]} />
            ))}
          </View>

          <View style={styles.keyboard}>
            {[
              ["1", "2", "3"],
              ["4", "5", "6"],
              ["7", "8", "9"],
              ["", "0", "←"],
            ].map((row, rowIndex) => (
              <View key={rowIndex} style={styles.keyboardRow}>
                {row.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.keyButton, item === "" && { backgroundColor: "transparent" }]}
                    onPress={() => {
                      if (item === "←") {
                        handleDelete();
                      } else if (item !== "") {
                        handlePress(item);
                      }
                    }}
                    disabled={item === ""}
                  >
                    <Text style={styles.keyButtonText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>

          <TouchableOpacity onPress={handleClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Отмена</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    width: "85%",
  },
  title: {
    color: "#fff",
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
  },
  dotsContainer: {
    flexDirection: "row",
    marginBottom: 30,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "gray",
    marginHorizontal: 8,
  },
  activeDot: {
    backgroundColor: "#fff",
  },
  keyboard: {
    width: "100%",
  },
  keyboardRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 15,
  },
  keyButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  keyButtonText: {
    color: "#fff",
    fontSize: 26,
  },
  cancelButton: {
    marginTop: 20,
  },
  cancelText: {
    color: "#aaa",
    fontSize: 16,
  },
});