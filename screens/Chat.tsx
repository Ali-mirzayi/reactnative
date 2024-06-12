import React, { useState, useEffect, useRef, useCallback, useLayoutEffect, useTransition } from "react";
import { View, Text, FlatList, StyleSheet, Button, DrawerLayoutAndroid, TouchableHighlight, useColorScheme, Image } from "react-native";
import baseURL from "../utils/baseURL";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SearchBar from "../components/SearchBar";
import { Room, User, ChatNavigationProps } from "../utils/types";
import { DrawerScreenProps } from '@react-navigation/drawer';
import { Ionicons } from "@expo/vector-icons";
import { useSocket, useUser } from "../socketContext";
import { getAllRooms, insertRoom } from "../utils/DB";
import Toast from "react-native-toast-message";
import LoadingPage from "../components/LoadingPage";
import ChatComponent from "../components/ChatComponent";
import useTheme from "../utils/theme";
import { useFocusEffect } from "@react-navigation/native";
import DrawerCore from "../components/Drawer";
import { storage } from "../mmkv";
import sleep from "../utils/wait";
import { usePushNotifications } from "../utils/usePushNotifications";

const Chat = ({ route, navigation }: DrawerScreenProps<ChatNavigationProps, 'Chat'>) => {
	const { beCheck } = route?.params || {};

	const setUser = useUser(state => state.setUser);
	const user = useUser(state => state.user);
	const socket = useSocket(state => state.socket);

	const drawer = useRef<DrawerLayoutAndroid>(null);
	const { colors } = useTheme();
	const initDarkMode = storage.getBoolean("darkMode");
	const colorScheme = useColorScheme();
	const scheme = (colorScheme === 'dark' ? false : true);
	const { expoPushToken, notification } = usePushNotifications();

	const [isPending, setPending] = useState(true);
	const [loading, setLoading] = useState(false)
	const [rooms, setRooms] = useState<Room[]>([]);
	const [users, setUsers] = useState<User[] | []>([]);
	const [screen, setScreen] = useState<'users' | 'rooms'>('rooms');
	const [darkMode, setDarkMode] = useState(initDarkMode !== undefined ? initDarkMode : scheme);

	const pressHandler = (item: User | undefined) => {
		socket?.emit("createRoom", [user, item], navigation.navigate("Messaging", { contact: item }))
	};

	const handleNavigation = ({ contact, id }: { contact: User, id: string }) => {
		navigation.navigate("Messaging", { contact, id });
	};

	function setter(data: Room[]) {
		data.forEach(room => {
			insertRoom(room);
		});
	};

	const notifData = notification?.request.content.data;

	useFocusEffect(
		useCallback(() => {
			if(socket?.id){
				socket?.emit('setSocketId', { 'id': socket?.id, 'name': user?.name });
			}
			const unsubscribe = navigation.addListener('focus', () => {
				(function () {
					fetch(`${baseURL()}/api`)
						.then((res) => res.json())
						.then((data: Room[]) => {
							data.forEach(room => {
								insertRoom(room);
							});
						})
						.catch((_) => Toast.show({
							type: 'error',
							text1: 'some thing went wrong',
							autoHide: false
						}));
				})();
				setPending(false);
			});
			return unsubscribe;
		}, [])
	);

	useEffect(() => {
		socket?.on("roomsList", setter);
		getAllRooms()
			.then((result: Room[] | any) => {
				if (result.length > 0) {
					setRooms(result.map((e: any) => JSON.parse(e.data)));
				}
			})
			.catch((_) => Toast.show({
				type: 'error',
				text1: 'some thing went wrong with db',
				autoHide: false
			}));
		return () => {
			socket?.off("roomsList", setter)
		};
	}, [socket]);

	useLayoutEffect(() => {
		if (notifData) {
			navigation.navigate('Messaging', {
				contact: notifData?.user,
				id: notifData?.roomId
			});
		setLoading(false);
			setPending(false);
		}
		if (expoPushToken && user) {
			//@ts-ignore
			user['token'] = expoPushToken
			setUser(user)
			try {
				fetch(`${baseURL()}/updateUser`, {
					method: 'POST',
					headers: {
						Accept: 'application/json',
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ user })
				});
			} catch (err) {
				console.log(`error in updateUser ${err}`);
			}
		}
	}, [expoPushToken?.data,notifData]);

	if (notifData && loading) { return (<LoadingPage active={true} />) }

	return (
		<View style={{ flex: 1 }}>
			<LoadingPage active={isPending} />
			<DrawerCore
				drawerRef={drawer}
				name={user?.name}
				beCheck={beCheck}
				darkMode={darkMode}
				setDarkMode={setDarkMode}
			>
				<View style={[styles.chatscreen, { backgroundColor: colors.background }]}>
					<View style={[styles.chattopContainer, { backgroundColor: colors.card }]}>
						<View style={styles.chatheader}>

							<View style={styles.burgerView}>
								<TouchableHighlight style={styles.mr10} underlayColor={"#e3e5ef"} onPress={() => drawer.current?.openDrawer()} >
									<Ionicons name="menu-sharp" style={styles.menu} color={colors.text} size={25} />
								</TouchableHighlight>
								<Text testID="ChatScreen" style={[styles.chatheading, { color: colors.mirza }]}>MirzaGram</Text>
							</View>
							<SearchBar setUsers={setUsers} setScreen={setScreen} />
						</View>
					</View>
			{/* <Image width={200} height={200} style={{width:200,height:200}} source={{uri:'file:///data/user/0/com.Mirzagram.PushNotifications/files/download/1718174908758.jpeg'}}/> */}
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
										renderItem={({ item }) => <ChatComponent messages={item.messages[item.messages.length - 1]} contact={item.users[0].name == user?.name ? item.users[1] : item.users[0]} handleNavigation={() => handleNavigation({ contact: item.users[0].name === user?.name ? item.users[1] : item.users[0], id: item.id })} />}
										data={rooms}
										keyExtractor={(item) => item.id}
									/>
								</View>
							) : (
								<View style={[styles.chatemptyContainer]}>
									<Text style={[styles.chatemptyText, { color: colors.text }]}>No rooms created!</Text>
									<Text style={{ color: colors.text }}>Click the icon above to create a Chat room</Text>
								</View>
							)
						}
					</View>
				</View>
			</DrawerCore>
		</View>
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
		marginRight: 10,
		borderRadius: 6
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
		height: 500,
		// width: 400
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
		bottom: 108,
		left: 20,
		width: 85,
		height: 85
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
	menu: {
		padding: 2
	}
});