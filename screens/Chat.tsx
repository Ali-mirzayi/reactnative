import React, { useState, useEffect, useLayoutEffect } from "react";
import { View, Text, FlatList, StyleSheet, TouchableHighlight } from "react-native";
import baseURL from "../utils/baseURL";
import SearchBar from "../components/SearchBar";
import { Room, User, ChatNavigationProps, IMessagePro, CountNewMessageType } from "../utils/types";
import { DrawerScreenProps } from '@react-navigation/drawer';
import { Ionicons } from "@expo/vector-icons";
import { useIsOpen, useMessage, useSetLastMessage, useSetRooms, useSocket, useUser } from "../socketContext";
import { getAllRooms, getRoom, insertRoom, updateMessage } from "../utils/DB";
import Toast from "react-native-toast-message";
import LoadingPage from "../components/LoadingPage";
import ChatComponent from "../components/ChatComponent";
import useTheme from "../utils/theme";
import { useIsFocused } from "@react-navigation/native";
import { usePushNotifications } from "../utils/usePushNotifications";
import { ensureDirExists, fileDirectory } from "../utils/directories";
import * as FileSystem from 'expo-file-system';
import DrawerCore from "../components/Drawer";
import { storage } from "../mmkv";
import FloatingMusicPlayer from "../components/FloatingMusicPlayer";
import { useTranslate } from "../language/useTranslate";

const Chat = ({ navigation }: DrawerScreenProps<ChatNavigationProps, 'Chat'>) => {
	const setUser = useUser(state => state.setUser);
	const user = useUser(state => state.user);
	const socket = useSocket(state => state.socket);
	const { lastMessage, setLastMessage } = useSetLastMessage();

	const { colors } = useTheme();
	const { expoPushToken, notification } = usePushNotifications();

	const [open, setOpen] = React.useState(false);
	const [isPending, setPending] = useState(false);
	const [loading, setLoading] = useState(false)
	const [rooms, setRooms] = useState<Room[]>([]);
	const [users, setUsers] = useState<User[] | []>([]);
	const [screen, setScreen] = useState<'users' | 'rooms'>('rooms');
	const [countNewMessages, setCountNewMessages] = useState<CountNewMessageType[] | []>([]);
	const [currentRoomId, setCurrentRoomId] = useState<string | undefined>(undefined);
	const [contactMap, setContactMap] = useState<{ [key: string]: string[] }>({});

	const isPlayerOpen = useIsOpen(state => state.open);
	const initDarkMode = storage.getBoolean("darkMode");
	const [darkMode, setDarkMode] = useState(initDarkMode !== undefined ? initDarkMode : true);
	const { i18n, locale } = useTranslate();
	const setMessages = useMessage(state => state.setMessages);

	const isFocused = useIsFocused();
	// const {rooms, setRooms} = useSetRooms();

	const pressUserHandler = async ({ contact }: { contact: User | undefined }) => {
		const roomIfExists = rooms.find(e => e.users[0]._id === contact?._id || e.users[1]._id === contact?._id);
		if (!!roomIfExists) {
			setCurrentRoomId(roomIfExists.id);
			navigation.navigate("Messaging", { contact: contact, roomId: roomIfExists.id });
		} else {
			setPending(true);
			socket?.emit("findRoom", { user, contact });
		}
	};

	const pressrRoomHandler = ({ contact, roomId }: { contact: User, roomId: string }) => {
		setCurrentRoomId(roomId);
		navigation.navigate("Messaging", { contact, roomId });
		handleCountNewMessages({ roomId, erase: true });
	};

	function setter(data: Room) {
		// insertRoom(data);
		// socket?.emit('joinInRoom', data.id);
		// setRooms(e => [...e, data]);
	};

	const handleLastMessages = ({ roomId, newMessage }: { roomId: string, newMessage: string }) => {
		setLastMessage(prevState => {
			const existingItem = prevState.find((item) => item.roomId === roomId);
			if (existingItem) {
				return prevState.map((item) =>
					item.roomId === roomId ? { ...item, message: newMessage } : item
				);
			} else {
				return [...prevState, { roomId, message: newMessage }];
			}
		})
	};

	const handleCountNewMessages = ({ roomId, erase }: { roomId: string, erase: boolean }) => {
		setCountNewMessages(prevState => {
			const existingItem = prevState.find((item) => item.id === roomId);
			if (existingItem) {
				return prevState.map((item) => item.id === roomId ? { ...item, count: erase ? 0 : item.count + 1 } : item);
			} else {
				return [...prevState, { count: erase ? 0 : 1, id: roomId }];
			}
		});
	};

	const handleCreateRoomResponse = async ({ newRoom, contact }: { newRoom: Room, contact: User }) => {
		setPending(false);
		const roomIfExists = rooms.find(e => e.id === newRoom.id);
		if (roomIfExists !== undefined) return;
		await insertRoom(newRoom);
		setRooms(e => [...e, newRoom]);
		setCurrentRoomId(newRoom.id);
		navigation.navigate("Messaging", { contact: contact, roomId: newRoom.id });
	}

	const handleFindRoomResponse = async (res: { result: Room | null, contact: User }) => {
		const { result, contact } = res;
		if (result?.id) {
			await insertRoom(result);
			setRooms(e => [...e, result]);
			setCurrentRoomId(result.id);
			navigation.navigate("Messaging", { contact, roomId: result.id });
			setPending(false);
		}
	}

	useEffect(() => {
		getAllRooms().then((result: Room[] | any) => {
			const freshRooms: Room[] = result.map((e: any) => JSON.parse(e.data));
			if (expoPushToken && user) {
				//@ts-ignor
				user['token'] = expoPushToken
				setUser(user);
				storage.set('user', JSON.stringify({ name: user.name, _id: user._id, avatar: '', token: expoPushToken }));
			};

			const cleanRoom = freshRooms.map(room => ({
				...room,
				messages: []
			}));

			try {
				fetch(`${baseURL()}/updateUser`, {
					method: 'POST',
					headers: {
						Accept: 'application/json',
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ user, cleanRoom })
				});
			} catch (err) {
				console.log(`error in updateUser ${err}`);
			}

			if (result.length > 0) {
				setRooms(freshRooms);
				// setRooms(()=>freshRooms);
			}
		}).catch(() => Toast.show({
			type: 'error',
			text1: 'some thing went wrong with db',
			autoHide: false
		}));
	}, [expoPushToken]);

	useEffect(() => {
		if (!socket) return;
		socket.on('chatNewMessage', async (data: IMessagePro & { roomId: string }) => {
			// console.log('chatNewMessage',user);
			const { roomId, ...newMessage } = data;
			if (!rooms.find(room => room.id === roomId)) {
				if (!user) return;
				//@ts-ignore
				const newRoom: Room = { id: roomId, users: [user, newMessage.user], messages: [] };
				// insertRoom(newRoom);
				// setRooms(e => [...e, newRoom]);
				setRooms(prevRooms => {
					if (prevRooms.find(room => room.id === roomId)) {
						console.log('update2');
						handleCountNewMessages({ roomId, erase: false });
						return prevRooms;  // No change  
					};
					console.log('update3');
					handleCountNewMessages({ roomId, erase: false });
					insertRoom(newRoom);
					return [...prevRooms, newRoom];  // Only update if a new room is added  
				});
			};
			const selectedRoom = await getRoom(roomId);
			if (newMessage.image) {
				await ensureDirExists();
				const fileName = `${new Date().getTime()}.jpeg`;
				const fileNamePrev = `${new Date().getTime() - 1000}.jpeg`;
				const fileUri = (baseURL() + '/' + newMessage.image).replace(/\\/g, '/');
				if (!newMessage.preView) {
					newMessage["preView"] = undefined;
					newMessage["image"] = fileUri;
					newMessage["fileName"] = fileName;
				} else {
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
				handleLastMessages({ roomId, newMessage: 'New Image' });
			} else if (newMessage.video) {
				await ensureDirExists();
				const thumbnailName = `${new Date().getTime()}.jpeg`;
				const fileName = `${new Date().getTime()}.mp4`;
				const videoUri = (baseURL() + '/' + newMessage.video).replace(/\\/g, '/');
				if (!newMessage.thumbnail) {
					newMessage["thumbnail"] = undefined;
					newMessage["fileName"] = fileName;
					newMessage["video"] = videoUri;
				} else {
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
				handleLastMessages({ roomId, newMessage: 'New Video' });
			} else if (newMessage.file && newMessage.fileName) {
				await ensureDirExists();
				const fileUri = (baseURL() + '/' + newMessage.file).replace(/\\/g, '/');
				newMessage["file"] = fileUri;
				handleLastMessages({ roomId, newMessage: 'New File' });
			} else if (newMessage.audio && newMessage.fileName) {
				await ensureDirExists();
				const fileUri = (baseURL() + '/' + newMessage.audio).replace(/\\/g, '/');
				newMessage["audio"] = fileUri;
				handleLastMessages({ roomId, newMessage: 'New audio' });
			} else {
				handleLastMessages({ roomId, newMessage: newMessage.text })
			};
			const roomMessage: Room[] = selectedRoom.map((e) => JSON.parse(e.data))[0]?.messages;
			const newRoomMessage = [newMessage, ...roomMessage];
			const contact = newMessage.user;
			socket.emit("recivedMessage", { messageId: newMessage._id, roomId, contact, contactId: contact._id });
			//@ts-ignore
			await updateMessage({ id: roomId, users: [user, contact], messages: newRoomMessage });
			if ((isFocused || currentRoomId !== roomId) && rooms.find(room => room.id === roomId)) {
				console.log('update');
				handleCountNewMessages({ roomId, erase: false });
			};
		});

		if (!user) return;

		socket.on("recivedMessage", async ({ messageId, contact, roomId }) => {
			try {
				const result = await getRoom(roomId);
				if (result.length > 0) {
					const roomMessage: IMessagePro[] = result.map((e: any) => JSON.parse(e.data))[0]?.messages;
					const newMessages = roomMessage.map(message => {
						if (message._id === messageId) {
							return { ...message, received: true, sent: true };
						} else {
							return message;
						}
					});
					setMessages(() => newMessages);
					await updateMessage({ id: roomId, users: [user, contact], messages: newMessages });
				}
				setPending(false);
			} catch (error) {
				console.log(error, 'v2');
				setPending(false);
			}
		});

		if (!isFocused) return;
		socket.on("connected", () => {
			socket.emit('setSocketIdAndjoin', user._id);
		});

		socket.on("createRoomResponse", handleCreateRoomResponse);
		socket.on("newRoom", setter);
		socket.on("findRoomResponse", handleFindRoomResponse);

		return () => {
			socket.off('chatNewMessage');
			socket.off('connected');
			socket.off('recivedMessage');
			socket.off("findRoomResponse", handleFindRoomResponse);
			socket.off('createRoomResponse', handleCreateRoomResponse);
			socket.off("newRoom", setter);
			// socket.off('setSocketIdAndjoin');

		};
	}, [socket, isFocused]);

	useEffect(() => {
		const contactRoomMap: { [key: string]: string[] } = rooms.reduce((acc, room) => {
			room.users.forEach(e => {
				if (e._id !== user?._id) {
					if (!acc[e._id]) {
						acc[e._id] = [];
					}
					acc[e._id].push(room.id);
				}
			});
			return acc;
		}, {} as { [key: string]: string[] });
		setContactMap(contactRoomMap);
	}, [rooms.length]);

	const notifData = notification?.request.content.data;

	useLayoutEffect(() => {
		if (notifData) {
			setCurrentRoomId(notifData?.roomId);
			navigation.navigate('Messaging', {
				contact: notifData?.user,
				roomId: notifData?.roomId
			});
			setLoading(false);
		};
	}, [expoPushToken?.data, notifData]);

	if (notifData && loading) { return (<LoadingPage active={true} />) }

	return (
		<View style={{ flex: 1, backgroundColor: colors.background }}>
			<LoadingPage active={isPending} />
			<DrawerCore
				open={open}
				setOpen={setOpen}
				darkMode={darkMode}
				setDarkMode={setDarkMode}
			>
				<View style={styles.chatscreen}>
					<View style={[styles.chattopContainer, { backgroundColor: colors.card }]}>
						<View style={styles.chatheader}>
							<View style={styles.burgerView}>
								<TouchableHighlight style={styles.mr10} underlayColor={"#e3e5ef"} onPress={() => setOpen(true)} >
									<Ionicons name="menu-sharp" style={styles.menu} color={colors.text} size={25} />
								</TouchableHighlight>
								<Text testID="ChatScreen" style={[styles.chatheading, { color: colors.mirza, fontSize: locale === 'en' ? 22 : 27 }]}>{i18n.t("MirzaGram")}</Text>
							</View>
							<SearchBar setUsers={setUsers} setScreen={setScreen} />
						</View>
					</View>
					{isPlayerOpen ? <FloatingMusicPlayer /> : null}
					<View style={styles.chatlistContainer}>
						{screen === "users" && users.length > 0 ?
								<FlatList
									renderItem={({ item }) => <ChatComponent contact={item} lastMessage={lastMessage.find(e => e.roomId === contactMap[item._id]?.[0])?.message} countNewMessage={countNewMessages.find(e => e.id === contactMap[item._id]?.[0])} messages={{ text: "Tap to start chatting" }} handleNavigation={() => pressUserHandler({ contact: item })} />}
									data={users}
									keyExtractor={(item) => item._id}
									extraData={lastMessage}
								/>
							 : <View />
						}
						{
							screen === "rooms" && rooms.length > 0 ? (
									<FlatList
										renderItem={({ item }) => <ChatComponent lastMessage={lastMessage.find(e => e.roomId === item.id)?.message} messages={item.messages[0]} countNewMessage={countNewMessages.find(e => e.id === item.id)} contact={item.users[0].name == user?.name ? item.users[1] : item.users[0]} handleNavigation={() => pressrRoomHandler({ contact: item.users[0].name === user?.name ? item.users[1] : item.users[0], roomId: item.id })} />}
										data={rooms}
										keyExtractor={(item) => item.id}
										extraData={lastMessage}
										scrollEnabled
									/>
							) : (
								<View style={[styles.chatemptyContainer]}>
									<Text style={[styles.chatemptyText, { color: colors.text }]}>{i18n.t("NoRooms")}</Text>
									<Text style={{ color: colors.text, fontSize: locale === 'fa' ? 17 : 16 }}>{i18n.t("SearchToconnection")}</Text>
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
		paddingHorizontal: 10,
		width: "100%",
	},
	chattopContainer: {
		borderRadius: 5,
		paddingHorizontal: 15,
		paddingVertical: 12,
		justifyContent: "center",
		marginTop: 15,
		marginBottom: 10,
		elevation: 4,
	},
	chatheading: {
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
		paddingTop: 10,
		paddingHorizontal: 10,
		flex:1
	},
	chatemptyContainer: {
		width: "100%",
		// height: "80%",
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