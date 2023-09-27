import React, { useState, useLayoutEffect, useEffect, useRef, useContext } from "react";
import { View, Text, Pressable, SafeAreaView, FlatList, StyleSheet, Button, DrawerLayoutAndroid, useColorScheme } from "react-native";
import ChatComponent from "../components/ChatComponent";
import baseURL from "../utils/baseURL";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SearchBar from "../components/SearchBar";
import { Room, RootStackParamList, User } from "../utils/types";
import { DrawerScreenProps } from '@react-navigation/drawer';
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import Checkbox from 'expo-checkbox';
import { socketContext } from "../socketContext";

const Chat = ({ route, navigation }: DrawerScreenProps<RootStackParamList, 'Chat'>) => {
	const [rooms, setRooms] = useState<Room[]>([]);
	const [users, setUsers] = useState<User[] | []>([]);
	const [screen, setScreen] = useState<'users' | 'rooms'>('rooms');
	const scheme = useColorScheme();
	const { setChat } = route.params;
	const drawer = useRef<DrawerLayoutAndroid>(null);
	const { colors } = useTheme();
	const [isChecked, setChecked] = useState(false);
	const [darkMode, setDarkMode] = useState(scheme === 'dark' ? true : false);
	const {socket,user}:any = useContext(socketContext);

	const Drawer = () => {
		return (
			<View style={[styles.container, { backgroundColor: colors.background }]}>
				<Text style={styles.paragraph}>I'm in the Drawer!</Text>
				<Pressable onPress={()=>setDarkMode(!darkMode)}>
				<Ionicons name={darkMode?"moon-outline":"sunny"} size={40} color={"black"} />
				</Pressable>
				<Ionicons name="logo-linkedin" size={35} color="#317daf" />
				<Ionicons name="logo-github" size={35} color="black" />
				<Ionicons name="exit-outline" size={35} color="black" />
				<View>
					<Text>Remove all data after leave app</Text>
					<Checkbox
						disabled={false}
						value={isChecked}
						color={isChecked ? '#4630EB' : undefined}
						onValueChange={setChecked}
					/>
				</View>
			</View>
		)
	}

	const pressHandler = (item: User | undefined) => {
		socket.emit("createRoom", [user, item], navigation.navigate("Messaging", { contact: item }))
	};

	const handleNavigation = (contact: User) => {
		// @ts-ignore
		navigation.navigate("Messaging", { contact });
	};

	function setter(value: Room[]) {
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
		<DrawerLayoutAndroid
			ref={drawer}
			drawerWidth={300}
			drawerPosition={"left"}
			keyboardDismissMode="on-drag"
			drawerBackgroundColor="red"
			renderNavigationView={Drawer}
		// renderNavigationView={()=>Darwer({colors,toggleCheckBox, setToggleCheckBox})}
		>
			<SafeAreaView style={[styles.chatscreen, { backgroundColor: colors.background }]}>
				<StatusBar style="auto" />
				<View style={[styles.chattopContainer, { backgroundColor: colors.card }]}>
					<View style={styles.chatheader}>
						<View style={styles.burgerView}>
							<Pressable onPress={() => drawer.current?.openDrawer()}>
								<Ionicons name="menu-sharp" style={styles.mr10} size={25} />
							</Pressable>
							<Text style={styles.chatheading}>Mirza</Text>
						</View>
						<View style={{ position: "relative" }}>
							<SearchBar setUsers={setUsers} setScreen={setScreen} />
						</View>
					</View>
				</View>
				<View style={styles.chatlistContainer}>
					{screen === "users" && users.length > 0 ?
						<View>
							<FlatList
								renderItem={({ item }) => <ChatComponent contact={item} messages={{ text: "Tap to start chatting" }} handleNavigation={() => pressHandler(item)} />}
								data={users}
							/>
						</View> : <View />
					}
					{
						screen === "rooms" && rooms.length > 0 ? (
							<View>
								<FlatList
									renderItem={({ item }) => <ChatComponent messages={item.messages[item.messages.length - 1]} contact={item.users[0] === user ? item.users[1] : item.users[0]} handleNavigation={() => handleNavigation(item.users[0] === user ? item.users[1] : item.users[0])} />}
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
		</DrawerLayoutAndroid>
	);
};

export default Chat;

const styles = StyleSheet.create({
	chatscreen: {
		flex: 1,
		position: "relative",
		padding: 10,
		width: "100%",
	},
	chattopContainer: {
		borderRadius: 5,
		paddingHorizontal: 15,
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
	burgerView: {
		flexDirection: "row", alignItems: "center"
	},
	mr10: {
		marginRight: 10
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
	chatemptyText: {
		fontWeight: "bold", fontSize: 24, paddingBottom: 30
	},
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
});