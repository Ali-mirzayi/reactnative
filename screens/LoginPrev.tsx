import { Text, StyleSheet, TouchableHighlight, View } from 'react-native'
import { LoginNavigationProps } from '../utils/types';
import { StackScreenProps } from '@react-navigation/stack';
import LottieView from 'lottie-react-native';
import useTheme from '../utils/theme';
import { useNavigation } from '@react-navigation/native';

export default function LoginPrev({}: StackScreenProps<LoginNavigationProps, 'LoginPrev'>) {
	const { colors } = useTheme();
    const {navigate}:any = useNavigation();

    return (
        <View style={[styles.Container,{backgroundColor:colors.background}]}>
            <LottieView autoPlay source={require('../assets/security.json')} style={styles.ImageContainer} />
            <Text style={[styles.Mirza,{color:colors.mirza}]}>MirzaGram</Text>
            <Text style={[styles.MirzaDesc,{color:colors.text}]}>Chat safely without server database</Text>
            <Text style={[styles.MirzaDesc,{color:colors.text}]}>We protect you privacy</Text>
            <TouchableHighlight style={styles.ButtonContainer} onPress={() => navigate('Login')} underlayColor={"#c8cce0"}>
                <Text testID='LoginPrevScreen' style={styles.Button}>let's roll</Text>
            </TouchableHighlight>
        </View>
    )
}

const styles = StyleSheet.create({
    Container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center"
    },
    ImageContainer: {
        width: 250,
        height: 250,
    },
    Mirza: {
        fontSize: 25,
        fontWeight: "700",
        marginTop: 20,
        marginBottom: 7,
    },
    MirzaDesc: {
        textAlign: "center",
        fontSize: 17,
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
        fontSize: 22,
        fontWeight: '500',
        textAlign: "center"
    }
});