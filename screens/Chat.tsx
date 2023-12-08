import React, { useState, useLayoutEffect, useEffect, useRef, useContext } from "react";
import { View, Text, Pressable, SafeAreaView, FlatList, StyleSheet, Button, DrawerLayoutAndroid, useColorScheme } from "react-native";
import ChatComponent from "../components/ChatComponent";
import baseURL from "../utils/baseURL";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SearchBar from "../components/SearchBar";
import { Room, RootStackParamList, User } from "../utils/types";
import { DrawerScreenProps } from '@react-navigation/drawer';
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import Checkbox from 'expo-checkbox';
import { socketContext } from "../socketContext";
import { deleteRooms, getAllRooms, insertRoom } from "../utils/DB";
import Link from "../utils/Link";

const Chat = ({ route, navigation }: DrawerScreenProps<RootStackParamList, 'Chat'>) => {
	const [rooms, setRooms] = useState<Room[]>([]);
	const [users, setUsers] = useState<User[] | []>([]);
	const [screen, setScreen] = useState<'users' | 'rooms'>('rooms');
	const scheme = useColorScheme();
	const { setChat, beCheck } = route.params;
	const [isChecked, setChecked] = useState<boolean | undefined>(false);
	const drawer = useRef<DrawerLayoutAndroid>(null);
	const { colors } = useTheme();
	const [darkMode, setDarkMode] = useState(scheme === 'dark' ? true : false);
	const { socket, user }: any = useContext(socketContext);


	const Drawer = () => {
		async function onValueChange(value: any) {
			setChecked(value);
			if (value) {
				await AsyncStorage.setItem("clearAll", "true");
			} else {
				await AsyncStorage.setItem("clearAll", "false");
			}
		}

		return (
			<View style={[styles.drawerContainer, { backgroundColor: colors.background }]}>
				<Text style={[styles.chatheading, styles.user]}>{user.name}</Text>
				<Ionicons onPress={() => setDarkMode(!darkMode)} style={styles.darkMode} name={darkMode ? "moon-outline" : "sunny"} size={40} color={"black"} />
				<View style={{ flexDirection: "row" }}>
					<Link url={'https://www.linkedin.com/in/alimirzaeizade/'}>
						<Ionicons name="logo-linkedin" style={{ marginHorizontal: 20 }} size={35} color="#317daf" />
					</Link>
					<Link url={"https://github.com/Ali-mirzayi"}>
						<Ionicons name="logo-github" style={{ marginHorizontal: 20 }} size={35} color="black" />
					</Link>
				</View>
				<View style={styles.removeContainer}>
					<Text style={styles.removeText}>Remove all data after leave app</Text>
					<Checkbox
						disabled={false}
						value={isChecked}
						color={isChecked ? '#4630EB' : undefined}
						onValueChange={onValueChange}
						style={styles.removeCheck}
					/>
				</View>
			</View>
		)
	};

	async function getClearCheck() {
		if (beCheck) {
			setChecked(beCheck);
			await AsyncStorage.setItem("clearAll", "true");
		}
	};

	const pressHandler = (item: User | undefined) => {
		socket.emit("createRoom", [user, item], navigation.navigate("Messaging", { contact: item }))
	};

	const handleNavigation = ({ contact, id }: { contact: User, id: string }) => {
		navigation.navigate("Messaging", { contact, id });
	};

	function setter(data: Room[]) {
		data.forEach(room => {
			insertRoom(room);
		});
	}

	useLayoutEffect(() => {
		setChat(2);
		getClearCheck();
		(function () {
			fetch(`${baseURL()}/api`)
				.then((res) => res.json())
				.then((data: Room[]) => {
					console.log('insert');
					data.forEach(room => {
						insertRoom(room);
					});
				})
				.catch((err) => console.error(err, 'error'));
		})();
	}, []);

	useEffect(() => {
		socket.on("roomsList", setter);
		getAllRooms()
			.then((result: Room[] | any) => {
				if (result.length > 0) {
					setRooms(result.map((e: any) => JSON.parse(e.data)));
				}
			})
			.catch(error => {
				console.log(error); // handle the error here
			});
		return () => {
			socket.off("roomsList", setter)
		};
	}, [socket]);

	return (
		<DrawerLayoutAndroid
			ref={drawer}
			drawerWidth={300}
			drawerPosition={"left"}
			renderNavigationView={Drawer}
		>
			<SafeAreaView style={[styles.chatscreen, { backgroundColor: colors.background }]}>
				<View style={[styles.chattopContainer, { backgroundColor: colors.card }]}>
					<View style={styles.chatheader}>
						<View style={styles.burgerView}>
							<Ionicons name="menu-sharp" style={styles.mr10} size={25} onPress={() => drawer.current?.openDrawer()} />
							<Text style={styles.chatheading}>Mirza Gram</Text>
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
									renderItem={({ item }) => <ChatComponent messages={item.messages[item.messages.length - 1]} contact={item.users[0].name == user.name ? item.users[1] : item.users[0]} handleNavigation={() => handleNavigation({ contact: item.users[0].name === user.name ? item.users[1] : item.users[0], id: item.id })} />}
									data={rooms}
									keyExtractor={(item) => item.id}
								/>
								<Button title="clear" onPress={async () => await AsyncStorage.clear()} />
							</View>
						) : (
							<View style={styles.chatemptyContainer}>
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
		fontSize: 22,
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
		flexDirection: "row",
		alignItems: "center"
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
	drawerContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		position: "relative",
	},
	paragraph: {
		padding: 16,
		fontSize: 15,
		textAlign: 'center',
	},
	user: {
		position: "absolute",
		top: 45,
		left: 30
	},
	darkMode: {
		position: "absolute",
		top: 45,
		right: 30
	},
	removeContainer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		position: "absolute",
		bottom: 20,
		right: 5
	},
	removeCheck: {
		marginHorizontal: 10
	},
	removeText: {
		// color: "white"
	}
});