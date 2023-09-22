import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

interface Props {
    colors: {
        primary: string;
        background: string;
        card: string;
        text: string;
        border: string;
        notification: string;
    },
    toggleCheckBox: boolean;
    setToggleCheckBox: React.Dispatch<React.SetStateAction<boolean>>
}

export default function Darwer({ colors, toggleCheckBox, setToggleCheckBox }: Props) {
    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Text style={styles.paragraph}>I'm in the Drawer!</Text>
            <Ionicons name="logo-linkedin" size={35} color="#317daf" />
            <Ionicons name="logo-github" size={35} color="black" />
            <Ionicons name="exit-outline" size={35} color="black" />
            <View>
                <Text>Remove all data after leave chat</Text>

            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    paragraph: {
        padding: 16,
        fontSize: 15,
        textAlign: 'center',
    },
})