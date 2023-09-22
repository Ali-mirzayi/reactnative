;import React, { useState } from "react";
import { Text, SafeAreaView, View, TextInput, Pressable, Alert, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from 'expo-status-bar';
import Animated from "react-native-reanimated";
import { LoginNavigationProps } from "../utils/types";
import { generateID } from "../utils/utils";
import { StackScreenProps } from "@react-navigation/stack";
import baseURL from "../utils/baseURL";
import { useTheme } from "@react-navigation/native";

const Login = ({ navigation }: StackScreenProps<LoginNavigationProps,'Login'>) => {
		const [username, setUsername] = useState("");
		const { colors } = useTheme();

		const id = generateID(); 
		const storeUsername = async () => {
			try {
			const response = await fetch(`${baseURL()}/checkUser`,{
				method: 'POST',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({_id: id,name:username,avatar:'',Date:new Date()})});
			const json = await response.json();
			console.log(json);
			// socket.emit("createUser", {_id: id,name:username,avatar:'',Date:new Date()});
			// socket.on("checkUser",(data:any)=>setisOK(data));
			if(json?.isOK===true){
				await AsyncStorage.setItem("username", username);
				await AsyncStorage.setItem("id", id);
				navigation.navigate("Chat");
			}else{
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
		<SafeAreaView style={[styles.loginscreen,{backgroundColor: colors.background,}]}>
			<StatusBar style="auto" />
			<Animated.Image
				source={require('../assets/mirza512.png')}
				style={styles.ImageContainer}
				sharedTransitionTag="tag"
			/>
			<Text style={styles.Mirza}>Sign in to MirzaGram</Text>
			<Text style={styles.MirzaDesc}>لطفا نام کاربری خود انتخاب کنید</Text>
			<View style={styles.logininputContainer}>
				<TextInput
					autoCorrect={false}
					placeholder='نام کاربری خود را انتخاب کنید'
					style={styles.logininput}
					onChangeText={(value) => setUsername(value)} />
			</View>
			
			<Pressable style={styles.ButtonContainer} onPress={handleSignIn}>
				<Text style={styles.Button}>ورود</Text>
			</Pressable>
			{/* <View style={{width:"auto",height:150}}/> */}
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
		marginBottom: 7
	},
	MirzaDesc: {
		textAlign: "center",
		fontSize: 15,
		color: "#555",
		marginBottom: 15,
	},
	loginheading: {
		fontSize: 26,
		marginBottom: 10,
	},
	logininputContainer: {
		width: "100%",
		alignItems: "center",
		justifyContent: "center",
	},
	logininput: {
		borderWidth: 1,
		width: "80%",
		padding: 8,
		borderRadius: 2,
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