import React, { useState, useLayoutEffect, useEffect } from "react";
import { View, Text, Pressable, SafeAreaView, FlatList, Image, StyleSheet, Button, ScrollView } from "react-native";
import ChatComponent from "../components/ChatComponent";
import socket from "../utils/socket";
import baseURL from "../utils/baseURL";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SearchBar from "../components/SearchBar";
import { Room, RootStackParamList, User } from "../utils/types";
import { DrawerScreenProps } from '@react-navigation/drawer';

const Chat = ({ route, navigation }: DrawerScreenProps<RootStackParamList, 'Chat'>) => {
	const [rooms, setRooms] = useState<Room[]>([]);
	const [users, setUsers] = useState<User[] | []>([]);
	const [screen, setScreen] = useState<'users' | 'rooms'>('rooms')
	const { user, setChat } = route.params;
	
	const pressHandler = (item: User | undefined) => {
		socket.emit("createRoom", [user, item], navigation.navigate("Messaging", { user, contact: item }))
	};

	const handleNavigation = (contact: User) => {
		// @ts-ignore
		navigation.navigate("Messaging", {user, contact});
	};

	function setter (value:Room[]) {
		setRooms(value)
	}

	useLayoutEffect(() => {
		(async function () {
			fetch(`${baseURL()}/api`)
				.then((res) => res.json())
				.then((data) => setRooms(data))
				.catch((err) => console.error(err, 'sd'));
		})();
		setChat(2)
	}, []);

	useEffect(() => {
		socket.on("roomsList", setter);
		return () => {
			socket.off("roomsList", setter)
		}
	}, [socket]);

	return (
		<>
			<SafeAreaView style={styles.chatscreen}>
				<StatusBar style="auto" />
				<View style={styles.chattopContainer}>
					<View style={styles.chatheader}>
						<Text style={styles.chatheading}>Mirza</Text>
						<View style={{ position: "relative" }}>
							<SearchBar setUsers={setUsers} user={user} setScreen={setScreen} />
						</View>
					</View>
				</View>
				<View style={styles.chatlistContainer}>
					{screen === "users" && users.length > 0 ?
						<View>
							<FlatList
								renderItem={({ item }) => <ChatComponent contact={item} messages={{text:"Tap to start chatting"}} handleNavigation={()=>pressHandler (item)}/>}
								data={users}
							/>
						</View> : <View />
					}
					{
						screen === "rooms" && rooms.length > 0 ? (
							<View>
								<FlatList
									renderItem={({ item }) => <ChatComponent messages={item.messages[item.messages.length - 1]} contact={item.users[0]===user ? item.users[1] : item.users[0]} handleNavigation={() => handleNavigation(item.users[0]===user ? item.users[1] : item.users[0])} />}
									data={rooms}
									keyExtractor={(item) => item.id}
								/>
								<Button title="clear" onPress={async () => await AsyncStorage.clear()} />
							</View>
						) : (
							<View style={styles.chatemptyContainer}>
								<Pressable style={{ backgroundColor: "#3F72AF", padding: 7 }} onPress={async () => await AsyncStorage.clear()} >
									<Text style={{ color: "#fff" }}>Clear</Text>
								</Pressable>
								<Text style={styles.chatemptyText}>No rooms created!</Text>
								<Text>Click the icon above to create a Chat room</Text>
							</View>
						)
					}
				</View>
			</SafeAreaView>
		</>
	);
};

export default Chat;

const styles = StyleSheet.create({
	chatscreen: {
		flex: 1,
		position: "relative",
		backgroundColor: "#EEF1FF",
		padding: 10,
		width: "100%",
	},
	chattopContainer: {
		backgroundColor: "#F9F7F7",
		borderRadius: 3,
		paddingHorizontal: 20,
		paddingVertical: 12,
		justifyContent: "center",
		marginVertical: 15,
		elevation: 4,
	},
	chatheading: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#3F72AF",
	},
	chatheader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		position: "relative"
	},
	chatlistContainer: {
		paddingHorizontal: 10,
	},
	chatemptyContainer: {
		width: "100%",
		height: "80%",
		alignItems: "center",
		justifyContent: "center",
	},
	chatemptyText: { fontWeight: "bold", fontSize: 24, paddingBottom: 30 },
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