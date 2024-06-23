import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import { View, Text, FlatList, StyleSheet, DrawerLayoutAndroid, TouchableHighlight, useColorScheme } from "react-native";
import baseURL from "../utils/baseURL";
import SearchBar from "../components/SearchBar";
import { Room, User, ChatNavigationProps, IMessagePro, CountNewMessageType, LastMessageType } from "../utils/types";
import { DrawerScreenProps } from '@react-navigation/drawer';
import { Ionicons } from "@expo/vector-icons";
import { useLastMessage, useSocket, useUser } from "../socketContext";
import { getAllRooms, getRoom, insertRoom, updateMessage } from "../utils/DB";
import Toast from "react-native-toast-message";
import LoadingPage from "../components/LoadingPage";
import ChatComponent from "../components/ChatComponent";
import useTheme from "../utils/theme";
import { useIsFocused } from "@react-navigation/native";
import DrawerCore from "../components/Drawer";
import { storage } from "../mmkv";
import { usePushNotifications } from "../utils/usePushNotifications";
import { ensureDirExists, fileDirectory } from "../utils/directories";
import * as FileSystem from 'expo-file-system';

const Chat = ({ route, navigation }: DrawerScreenProps<ChatNavigationProps, 'Chat'>) => {
	const { beCheck } = route?.params || {};

	const setUser = useUser(state => state.setUser);
	const user = useUser(state => state.user);
	const socket = useSocket(state => state.socket);
	const {lastMessage, setLastMessage} = useLastMessage();

	const drawer = useRef<DrawerLayoutAndroid>(null);
	const { colors } = useTheme();
	const initDarkMode = storage.getBoolean("darkMode");
	const colorScheme = useColorScheme();
	const scheme = (colorScheme === 'dark' ? false : true);
	const { expoPushToken, notification } = usePushNotifications();

	const [isPending, setPending] = useState(false);
	const [loading, setLoading] = useState(false)
	const [rooms, setRooms] = useState<Room[]>([]);
	const [users, setUsers] = useState<User[] | []>([]);
	const [screen, setScreen] = useState<'users' | 'rooms'>('rooms');
	const [darkMode, setDarkMode] = useState(initDarkMode !== undefined ? initDarkMode : scheme);
	const [countNewMessages, setCountNewMessages] = useState<CountNewMessageType[] | []>([]);

	const isFocused = useIsFocused();

	const pressUserHandler = ({contact}: {contact:User | undefined}) => {
		setPending(true);
		const roomIfExists = rooms.find(e=>e.users[0]._id || e.users[1]._id === contact?._id);
		if(roomIfExists){
			navigation.navigate("Messaging", { contact:contact, roomId:roomIfExists.id });
			setPending(false);
		}else{
			socket?.emit("createRoom", { user, contact: contact });
			socket?.on("createRoomResponse", (data: Room) => {
				if (!data) setPending(false);
				console.log(data, 'setter', user?.name);
				insertRoom(data);
				navigation.navigate("Messaging", { contact: contact, roomId: data.id });
				setRooms(e => [...e, data]);
				setPending(false);
			});
		}
	};

	const pressrRoomHandler = ({ contact, roomId }: { contact: User, roomId: string }) => {
		navigation.navigate("Messaging", { contact, roomId });
		handleCountNewMessages({roomId,erase:true});
	};

	function setter(data: Room) {
		console.log(data, 'setter', user?.name);
		socket?.emit('joinInRoom', data.id);
		insertRoom(data);
		setRooms(e => [...e, data]);
	};

	const handleLastMessages = ({roomId,newMessage}: {roomId:string,newMessage:string}) => {
		setLastMessage(prevState => {
			const existingItem = prevState.find((item) => item.roomId === roomId);
			if (existingItem) {
				return prevState.map((item) =>
					item.roomId === roomId ? { ...item, message: newMessage } : item
				);
			} else {
				return [...prevState, { roomId,message: newMessage }];
			}
		})
	};
	const handleCountNewMessages = ({roomId,erase}: {roomId:string,erase:boolean}) => {
		setCountNewMessages(prevState => {
			const existingItem = prevState.find((item) => item.id === roomId);
			if (existingItem) {
				return prevState.map((item) =>
					item.id === roomId ? { ...item, count: erase ? 0 : item.count + 1 } : item
				);
			} else {
				return [...prevState, { count: erase ? 0 : 1, id: roomId }];
			}
		});
	};

	useEffect(() => {
		getAllRooms().then((result: Room[] | any) => {
			if (result.length > 0) {
				setRooms(result.map((e: any) => JSON.parse(e.data)));
			}
		}).catch((_) => Toast.show({
			type: 'error',
			text1: 'some thing went wrong with db',
			autoHide: false
		}));
	}, []);

	const notifData = notification?.request.content.data;

	useEffect(() => {
		if (!socket || !isFocused || !user) return;
		socket.on("connected", (e: any) => {
			socket.emit('joinInRooms', user._id);
			socket.emit('setSocketId', { 'socketId': e, 'userId': user._id, 'userRoomId': undefined });
		});

		socket.on('chatNewMessage', async (data: IMessagePro & { roomId: string }) => {
			const { roomId, ...newMessage } = data;
			const selectedRoom = await getRoom(roomId);
			if (newMessage.image) {
				await ensureDirExists();
				const fileName = `${new Date().getTime()}.jpeg`;
				const fileNamePrev = `${new Date().getTime() - 1000}.jpeg`;
				const fileUri = (baseURL() + '/' + newMessage.image).replace(/\\/g, '/');
				if(!newMessage.preView){
					newMessage["preView"] = undefined;
					newMessage["image"] = fileUri;
					newMessage["fileName"] = fileName;
				}else{
					await FileSystem.writeAsStringAsync(fileDirectory + fileNamePrev, newMessage.preView, { encoding: "base64" }).then(() => {
						newMessage["preView"] = fileDirectory + fileNamePrev;
						newMessage["image"] = fileUri;
						newMessage["fileName"] = fileName;
					}).catch(error => {
						newMessage["preView"] = undefined;
						newMessage["image"] = fileUri;
						newMessage["fileName"] = fileName;
						console.error(error, 'errrrrrrrr');
					});
				};
				handleLastMessages({roomId,newMessage:'New Image'});
			} else if (newMessage.video) {
				await ensureDirExists();
				const thumbnailName = `${new Date().getTime()}.jpeg`;
				const fileName = `${new Date().getTime()}.mp4`;
				const videoUri = (baseURL() + '/' + newMessage.video).replace(/\\/g, '/');
				if(!newMessage.thumbnail){
					newMessage["thumbnail"] = undefined;
					newMessage["fileName"] = fileName;
					newMessage["video"] = videoUri;
				}else{
					await FileSystem.writeAsStringAsync(fileDirectory + thumbnailName, newMessage.thumbnail, { encoding: "base64" }).then(() => {
						newMessage["thumbnail"] = fileDirectory + thumbnailName;
						newMessage["fileName"] = fileName;
						newMessage["video"] = videoUri;
					}).catch(error => {
						newMessage["thumbnail"] = undefined;
						newMessage["fileName"] = fileName;
						newMessage["video"] = videoUri;
						console.error(error, 'errrrrrrrr');
					});
				};
				handleLastMessages({roomId,newMessage:'New Video'});
			} else if (newMessage.file && newMessage.fileName) {
				await ensureDirExists();
				const fileUri = (baseURL() + '/' + newMessage.file).replace(/\\/g, '/');
				newMessage["file"] = fileUri;
				handleLastMessages({roomId,newMessage:'New File'});
			}else{
				handleLastMessages({roomId,newMessage:newMessage.text})
			};
			const roomMessage: Room[] = selectedRoom.map((e) => JSON.parse(e.data))[0]?.messages;
			const newRoomMessage = [newMessage, ...roomMessage];
			const contact = newMessage.user;
			//@ts-ignore
			await updateMessage({ id: roomId, users: [user, contact], messages: newRoomMessage });
			handleCountNewMessages({roomId,erase:false});
		});

		socket.on("newRoom", setter);

		return () => {
			socket.off('chatNewMessage');
			socket.off('connected');
			socket.off("newRoom", setter);
		};
	}, [socket, isFocused]);

	useLayoutEffect(() => {
		if (notifData) {
			navigation.navigate('Messaging', {
				contact: notifData?.user,
				roomId: notifData?.roomId
				});
			setLoading(false);
			// setPending(false);
		};
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
	}, [expoPushToken?.data, notifData]);

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
					<View style={styles.chatlistContainer}>
						{screen === "users" && users.length > 0 ?
							<View>
								<FlatList
									renderItem={({ item }) => <ChatComponent contact={item} lastMessage={undefined} countNewMessage={undefined} messages={{ text: "Tap to start chatting" }} handleNavigation={() => pressUserHandler({contact:item})} />}
									data={users}
								/>
							</View> : <View />
						}
						{
							screen === "rooms" && rooms.length > 0 ? (
								<View>
									<FlatList
										renderItem={({ item }) => <ChatComponent lastMessage={lastMessage.find(e=>e.roomId===item.id)?.message} messages={item.messages[0]} countNewMessage={countNewMessages.find(e=>e.id===item.id)} contact={item.users[0].name == user?.name ? item.users[1] : item.users[0]} handleNavigation={() => pressrRoomHandler({ contact: item.users[0].name === user?.name ? item.users[1] : item.users[0], roomId: item.id })} />}
										data={rooms}
										keyExtractor={(item) => item.id}
										extraData={lastMessage}
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