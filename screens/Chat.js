import React, { useState, useLayoutEffect, useEffect } from "react";
import { View, Text, Pressable, SafeAreaView, FlatList, StatusBar } from "react-native";
import { Feather } from "@expo/vector-icons";
import Modal from "../components/Modal";
import ChatComponent from "../components/ChatComponent";
import socket from "../utils/socket";
import { styles } from "../utils/styles";

const Chat = () => {
	const [visible, setVisible] = useState(false);
	const [rooms, setRooms] = useState([]);

	console.log(rooms);

	// const getRoom = async () => {
	// 	try {
	// 		const response = await fetch("https://e57e-135-125-113-241.ngrok-free.app/api", {
	// 			method: 'GET',
	// 			headers: {
	// 				'Accept': 'application/json',
	// 				'Content-type': 'application/json'
	// 			}
	// 		});
	// 		const json = await response.json();
	// 		console.log(json);
	// 	} catch (e) {
	// 		return;
	// 	}
	// }

	useLayoutEffect(() => {
		// getRoom();
			(async function () {
				fetch("https://2c9a-151-240-243-86.ngrok-free.app/api")
					.then((res) => res.json())
					.then((data) => setRooms(data))
					.catch((err) => console.error(err,'sd'));
			})();
	}, []);

	useEffect(() => {
		socket.on("roomsList", (rooms) => {
			setRooms(rooms);
		});
	}, [socket]);

	const handleCreateGroup = () => setVisible(true);

	return (
		<SafeAreaView style={styles.chatscreen}>
			<StatusBar />
			<View style={styles.chattopContainer}>
				<View style={styles.chatheader}>
					<Text style={styles.chatheading}>Chats</Text>
					<Pressable onPress={handleCreateGroup}>
						<Feather name='edit' size={24} color='green' />
					</Pressable>
				</View>
			</View>
			<View style={styles.chatlistContainer}>
				{rooms.length > 0 ? (
					<FlatList
						data={rooms}
						renderItem={({ item }) => <ChatComponent item={item} />}
						keyExtractor={(item) => item.id}
					/>
				) : (
					<View style={styles.chatemptyContainer}>
						<Text style={styles.chatemptyText}>No rooms created!</Text>
						<Text>Click the icon above to create a Chat room</Text>
					</View>
				)}
			</View>
			{visible ? <Modal setVisible={setVisible} /> : ""}
		</SafeAreaView>
	);
};

export default Chat;