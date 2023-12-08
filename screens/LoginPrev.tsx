import Animated from 'react-native-reanimated';
import { Text, StyleSheet, TouchableHighlight, View } from 'react-native'
import { LoginNavigationProps } from '../utils/types';
import { StackScreenProps } from '@react-navigation/stack';
// import { TouchableOpacity } from 'react-native-gesture-handler';

export default function LoginPrev({ navigation }:StackScreenProps<LoginNavigationProps,'LoginPrev'>) {

return (
    <View style={styles.Container}>
        <Animated.Image
            source={require('../assets/mirza512.png')}
            style={styles.ImageContainer}
            sharedTransitionTag="tag"
        />
        <Text style={styles.Mirza}>MirzaGram</Text>
        <Text style={styles.MirzaDesc}>قوی ترین چت اپ بی رقیب و بدون دیتابیس</Text>
        <Text style={styles.MirzaDesc}>با ما در امان چت کنید </Text>
        <TouchableHighlight style={styles.ButtonContainer} onPress={() => navigation.navigate('Login')} underlayColor={"#c8cce0"}>
            <Text style={styles.Button}>شروع کن !</Text>
        </TouchableHighlight>
    </View>
)
}

const styles = StyleSheet.create({
Container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF1FF"
},
ImageContainer: {
    width: 250,
    height: 250,
},
Mirza: {
    fontSize: 25,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 5
},
MirzaDesc: {
    textAlign: "center",
    fontSize: 18,
    color: "#555"
},
ButtonContainer: {
    marginTop: 20,
    backgroundColor: "#2DA5E0",
    borderRadius: 6,
    overflow: "hidden",
    width: "80%",
},
Button: {
    color: "white",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 13,
    backgroundColor: 'transparent',
    fontSize: 20,
    textAlign:"center"
}
});