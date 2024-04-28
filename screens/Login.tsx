import { useState } from "react";
import { Text, SafeAreaView, View, TextInput, Alert, StyleSheet, TouchableHighlight } from "react-native";
import { LoginNavigationProps } from "../utils/types";
import { generateID } from "../utils/utils";
import { StackScreenProps } from "@react-navigation/stack";
import baseURL from "../utils/baseURL";
import { useUser } from "../socketContext";
import { storage } from "../mmkv";
import LottieView from 'lottie-react-native';
import useTheme from "../utils/theme";

const Login = ({ route,navigation }: StackScreenProps<LoginNavigationProps, 'Login'>) => {
	const { beCheck } = route?.params || {};

	const [username, setUsername] = useState("");
	const { colors } = useTheme();
	const setUser = useUser(state => state.setUser);
	const id = generateID();

	const storeUsername = async () => {
		try {
			const response = await fetch(`${baseURL()}/checkUserToAdd`, {
				method: 'POST',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ _id: id, name: username, avatar: '' })
			});
			const json = await response.json();
			if (json?.isOK === true) {
				storage.set('user', JSON.stringify({ name: username, id }));
				setUser({ _id: id, name: username, avatar: '' })
				navigation.navigate('Chat', { beCheck });
			} else {
				Alert.alert("Error! invalid username");
			}
		} catch (e) {
			Alert.alert("Error! While saving username");
		}
	};

	const handleSignIn = () => {
		if (username.trim()) {
			storeUsername();
		} else {
			Alert.alert("Username is required.");
		}
	};

	return (
		<SafeAreaView style={[styles.loginscreen, { backgroundColor: colors.background, }]}>
			<LottieView autoPlay source={require('../assets/chat.json')} style={styles.ImageContainer} />
			<Text style={[styles.Mirza, { color: colors.loginMirza }]}>Sign in to MirzaGram</Text>
			<Text style={[styles.MirzaDesc, { color: colors.text }]}>please enter your username</Text>
			<View style={styles.logininputContainer}>
				<TextInput
					placeholderTextColor={colors.text}
					autoCorrect={false}
					placeholder="user name"
					style={[styles.logininput, { color: colors.text, borderColor: colors.boarder }]}
					value={username}
					onChangeText={setUsername} />
			</View>
			<TouchableHighlight style={styles.ButtonContainer} onPress={handleSignIn} underlayColor={"#c8cce0"}>
				<Text testID="LoginScreen" style={styles.Button}>Let's Chat</Text>
			</TouchableHighlight>
		</SafeAreaView>
	);
};

export default Login;

const styles = StyleSheet.create({
	loginscreen: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: 12,
		width: "100%",
	},
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
		fontSize: 22,
		fontWeight: "700",
		marginTop: 20,
		marginBottom: 7,
	},
	MirzaDesc: {
		textAlign: "center",
		fontSize: 15,
		marginBottom: 20,
	},
	logininputContainer: {
		width: "100%",
		alignItems: "center",
		justifyContent: "center",
	},
	logininput: {
		borderWidth: 2,
		width: "80%",
		paddingVertical: 7,
		paddingHorizontal: 12,
		fontSize: 18,
		borderRadius: 4,
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
		textAlign: "center",
		paddingHorizontal: 20,
		paddingTop: 10,
		paddingBottom: 13,
		backgroundColor: 'transparent',
		fontSize: 20
	}
});