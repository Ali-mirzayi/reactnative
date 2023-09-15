import React, { useState, useLayoutEffect, useEffect } from "react";
import { View, Text, Pressable, SafeAreaView, FlatList, Image, StyleSheet, Button, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Modal from "../components/Modal";
import ChatComponent from "../components/ChatComponent";
import socket from "../utils/socket";
import { styles } from "../utils/styles";
import baseURL from "../utils/baseURL";
import { StatusBar } from "expo-status-bar";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../Navigation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { TextInput } from "react-native-gesture-handler";


type Room = {
	id: string,
	name: string,
	messages: Message[]
}

type Message = {
	id: string;
	text: any;
	user: any;
	time: string;
}

const Chat = ({ route,navigation }: NativeStackScreenProps<RootStackParamList, 'Chat'>) => {
	const [visible, setVisible] = useState(false);
	const [rooms, setRooms] = useState<Room[]>([]);
	const [search, setSearch] = useState<string | undefined>();
	const [ser, setChatMessages] = useState<string[] | []>([]);
	const { user, setChat } = route.params;

	console.log(rooms);

	const handleSearch = (e: string) => {
		setSearch(e);
		socket.emit("findUser", {search:e, user:user});
		socket.on("findUser", (roomChats: any) => setChatMessages(roomChats));
	}

	const pressHandler = (item: string) => {
		// console.log(user===item);
		// socket.emit("createRoom", [user, item],socket.emit("findRoom",[user, item],socket.on("foundRoom")))
		socket.emit("createRoom", [user, item], navigation.navigate("Messaging", {user,contact:item}))
	};

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
		// socket.on('connection',(e:any)=>console.log(e,'connection'))
		socket.on("roomsList", (room: Room[]) => {
			setRooms(room);
		});
	}, [socket]);

	const handleCreateGroup = () => setVisible(true);
	return (
		<SafeAreaView style={styles.chatscreen}>
			<StatusBar style="auto" />
			<View style={styles.chattopContainer}>
				<View style={styles.chatheader}>
					<Text style={styles.chatheading}>Chats</Text>
					<Text style={styles.chatheading}>{route?.params?.user}</Text>
					<Pressable onPress={handleCreateGroup}>
						<Ionicons name='search' size={24} color='green' />
					</Pressable>
				</View>
			</View>
			<View style={styles.chatlistContainer}>
				<TextInput
					style={{ width: "100%", borderColor: "green", borderWidth: 2, paddingHorizontal: 20, paddingVertical: 5 }}
					value={search}
					onChangeText={handleSearch} />
				<View style={{ height: 150 }}>
					<FlatList
						style={{ height: 150 }}
						renderItem={({ item }: { item: string }) => <Pressable onPress={() => pressHandler(item)}>
							<Text>
								{item}
							</Text>
						</Pressable>
						}
						data={ser}
					/>

				</View>
				{rooms?.length > 0 ? (
					<View>
						{/* <FlatList
							renderItem={({ item }) => <ChatComponent item={item} />}
							data={rooms}
							keyExtractor={(item) => item.id}
						/> */}
						<Button title="clear" onPress={async () => await AsyncStorage.clear()} />
					</View>
				) : (
					<View style={styles.chatemptyContainer}>
						<Button title="clear" onPress={async () => await AsyncStorage.clear()} />
						{/* <Image source={require('../assets/mirza128.png')} style={styles.ImageContainer}/> */}
						<Text style={styles.chatemptyText}>No rooms created!</Text>
						<Text>Click the icon above to create a Chat room</Text>
					</View>
				)}
			</View>
			{/* <Modal visible={visible} setVisible={setVisible} /> */}
			{/* {visible ? <Modal setVisible={setVisible} /> : <View/>} */}
		</SafeAreaView>
	);
};

export default Chat;