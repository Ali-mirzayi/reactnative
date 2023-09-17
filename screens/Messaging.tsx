import React, { useEffect, useLayoutEffect, useState } from "react";
import { View, TextInput, Text, FlatList, Pressable } from "react-native";
import socket from "../utils/socket";
import MessageComponent from "../components/MessageComponent";
import { styles } from "../utils/styles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../Navigation";
import useTime from "../utils/useTime";

const Messaging = ({ route, navigation }:NativeStackScreenProps<RootStackParamList,'Messaging'>) => {
	const { user,contact } = route.params;
	const [chatMessages, setChatMessages] = useState([]);
	const [message, setMessage] = useState("");
	const {hour,mins} = useTime();

	const handleNewMessage = () => {
		if (user) {
			socket.emit("newMessage", {
				message,
				names: [user,contact],
				user,
				timestamp: { hour, mins },
			});
		}
		setMessage("")
	};


	useEffect(() => {
		// navigation.setOptions({ title: name });
		// socket.emit("findRoom", [user,contact],socket.on("roomMessages", (message:any) => setChatMessages(message)));
		socket.emit("findRoom", [user,contact])
		socket.on("roomMessages", (message:any) => setChatMessages(message))
	}, []);

	console.log(contact);

	useEffect(() => {
		// socket.on("foundRoom", (roomChats) => setChatMessages(roomChats));
		socket.on("roomMessages", (message:any) => setChatMessages(message))

	}, [socket]);

	return (
		<View style={styles.messagingscreen}>
			<View
				style={[
					styles.messagingscreen,
					{ paddingVertical: 15, paddingHorizontal: 10 },
				]}
			>
				{chatMessages[0] ? (
					<FlatList
						data={chatMessages}
						renderItem={({ item }) => (
							<MessageComponent item={item} user={user} />
						)}
						keyExtractor={(item:any) => item.id}
					/>
				) : (
					<Text/>
				)}
			</View>
			<View style={styles.messaginginputContainer}>
				<TextInput
					style={styles.messaginginput}
					onChangeText={(value) => setMessage(value)}
					value={message}
				/>
				<Pressable
					style={styles.messagingbuttonContainer}
					onPress={handleNewMessage}
				>
					<View>
						<Text style={{ color: "#f2f0f1", fontSize: 20 }}>SEND</Text>
					</View>
				</Pressable>
			</View>
		</View>
	);
};

export default Messaging;