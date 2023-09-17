import { View, Text, Pressable } from "react-native";
import React, { useLayoutEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { styles } from "../utils/styles";

const ChatComponent = ({ item,user }:any) => {
	const navigation = useNavigation();
	
	const contact = item.users[0]===user ? item.users[1] : item.users[0] 
	const messages = item.messages[item.messages.length - 1];

	const handleNavigation = () => {
		// @ts-ignore
		navigation.navigate("Messaging", {user, contact});
	};

	// console.log(contact);

	return (
		<Pressable style={styles.cchat} onPress={handleNavigation}>
			<Ionicons
				name='person-circle-outline'
				size={45}
				color='black'
				style={styles.cavatar}
			/>
			<View style={styles.crightContainer}>
				<View>
					<Text style={styles.cusername}>{contact}</Text>
					<Text style={styles.cmessage}>
						{messages?.text ? messages.text : "Tap to start chatting"}
					</Text>
				</View>
				<View>
					<Text style={styles.ctime}>
						{messages?.time ? messages.time : "now"}
					</Text>
				</View>
			</View>
		</Pressable>
	);
};

export default ChatComponent;