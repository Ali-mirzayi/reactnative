import React, { useState, useLayoutEffect, useEffect } from "react";
import { View, Text, Pressable, SafeAreaView, FlatList, Image,StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import Modal from "../components/Modal";
import ChatComponent from "../components/ChatComponent";
import socket from "../utils/socket";
import { styles } from "../utils/styles";
import baseURL from "../utils/baseURL";
import { StatusBar } from "expo-status-bar";

const Chat = ({route}) => {
	const [visible, setVisible] = useState(false);
	const [rooms, setRooms] = useState([]);

	useLayoutEffect(() => {
			(async function () {
				fetch(`${baseURL}/api`)
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

	console.log(route.params);

	return (
		<SafeAreaView style={styles.chatscreen}>
			<StatusBar style="auto" />
			<View style={styles.chattopContainer}>
				<View style={styles.chatheader}>
					<Text style={styles.chatheading}>Chats</Text>
					<Text style={styles.chatheading}>{route.params.post}</Text>
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
						<Image source={require('../assets/mirza128.png')} styles={style.ImageContainer}/>
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