import { Platform } from "react-native"

export const apiUrl = Platform.OS == "web" ? "http://localhost:3000" : 'http://192.168.0.54:3000'