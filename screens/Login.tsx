import React, { useState } from "react";
import { Text, SafeAreaView, View, TextInput, Pressable, Alert } from "react-native";
import { styles } from "../utils/styles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from 'expo-status-bar';
import Animated from "react-native-reanimated";
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LoginNavigationProps } from "../Navigation";
import socket from "../utils/socket";

const Login = ({ navigation }: NativeStackScreenProps<LoginNavigationProps,'Login'>) => {
	const [username, setUsername] = useState("");
	const storeUsername = async () => {
		try {
			socket.emit("createUser", username);
			await AsyncStorage.setItem("username", username);
			navigation.navigate("Chat");
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
		<SafeAreaView style={styles.loginscreen}>
			<StatusBar style="auto" />
			<View style={styles.loginscreen}>
				<Animated.Image
					source={{ uri: 'https://img.freepik.com/premium-photo/long-shot-man-exploring-nature_23-2149884252.jpg?w=1060' }}
					style={{ width: 350, height: 250, margin: 50, borderRadius: 10 }}
					sharedTransitionTag="tag"
				/>
				<Text style={styles.loginheading}>Sign in</Text>
				<View style={styles.logininputContainer}>
					<TextInput
						autoCorrect={false}
						placeholder='Enter your username'
						style={styles.logininput}
						onChangeText={(value) => setUsername(value)} />
				</View>
				<Pressable onPress={handleSignIn}>
					<Text style={styles.loginbuttonText}>Get Started</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	);
};

export default Login;