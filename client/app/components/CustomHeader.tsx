import { View, Dimensions, Text, StyleSheet } from "react-native"

const CustomHeader = ({ title }: { title: string }) => {
  const screenWidth = Dimensions.get('window').width

  return (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={[styles.bottomLine, { width: screenWidth * 0.9 }]} />
    </View>
  )
}

export default CustomHeader

const styles = StyleSheet.create({
    headerContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#445b73',
      paddingTop: 40
    },
    headerTitle: {
      color: '#fff',
      fontSize: 22,
      marginBottom: 10,
      fontWeight: 'bold',
    },
    bottomLine: {
      height: 2,
      backgroundColor: '#fff',
      marginTop: 5, 
    }
  })