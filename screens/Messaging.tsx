import React, { useState, useEffect, useCallback } from 'react'
import { GiftedChat, IMessage } from 'react-native-gifted-chat'
import { StackScreenProps } from "@react-navigation/stack";
import { Room, RootStackParamList } from '../utils/types';
import { useSocket, useUser } from '../socketContext';
import { UpdateMessage, getRoom } from '../utils/DB';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import * as FileSystem from 'expo-file-system';
import { downloadsDir, ensureDirExists } from '../utils/directories';
import LoadingPage from '../components/LoadingPage';
import { renderActions, renderBubble, RenderChatFooter, renderInputToolbar, renderMessageVideo, renderSend, renderTime } from '../components/Message';
import useTheme from '../utils/theme';
import { Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import PushNotificationSend from '../components/SendPushNotification';

const Messaging = ({ route }: StackScreenProps<RootStackParamList, 'Messaging'>) => {
	const { contact, id }: any = route.params;
	const [messages, setMessages] = useState<IMessage[]>([]);
	const [roomId, setRoomId] = useState<string | undefined>(id);
	const [open, setOpen] = useState<boolean>(false); // renderChatFooter
	const [status, setStatus] = useState<boolean | undefined>(undefined); // connection
	const [isInRoom, setIsInRoom] = useState<boolean>(true);
	const user: any = useUser(state => state.user)
	const translateY = useSharedValue(1000);
	const [isPending, setPending] = useState(true); // set for roomId and save it db
	const socket = useSocket(state => state.socket);
	const { colors } = useTheme();

	useEffect(() => {
		if (socket) {
			socket.emit('checkStatus', contact.name);
			socket.on('checkStatusResponse', (res) => {
				setStatus(res.status)
			});
			// Listen for new messages from the server
			socket.on('newMessage', async (newMessage: IMessage) => {
				if (newMessage.image) {
					await ensureDirExists();
					const filename = downloadsDir + new Date().getTime() + ".jpeg";
					await FileSystem.writeAsStringAsync(filename, newMessage.image, { encoding: "base64" });
					newMessage["image"] = filename;
				} else if (newMessage.video) {
					await ensureDirExists();
					const filename = downloadsDir + new Date().getTime() + ".mp4";
					await FileSystem.writeAsStringAsync(filename, newMessage.video, { encoding: "base64" });
					newMessage["video"] = filename;
				};
				console.log('onResive',newMessage,'newMessage')
				setMessages((prevMessages: IMessage[]) => GiftedChat.append(prevMessages, [newMessage]));
			});
			return () => {
				socket.off('newMessage');
				socket.off('checkStatusResponse');
			}
		}
	}, [socket]);

	useEffect(() => {
		if (isPending == false && roomId) {
			UpdateMessage({ id: roomId, users: [user, contact], messages });
		}
	}, [messages]);

	useEffect(() => {
		if (open === true) {
			translateY.value = withTiming(300, { duration: 400 });
		} else {
			translateY.value = withTiming(700, { duration: 1000 });
		}
	}, [open]);

	useEffect(() => {
		setPending(true);
		socket?.emit('findRoom', [user, contact]);
		socket?.on('findRoomResponse', (room: Room) => {
			setRoomId(room.id);
			getRoom(room.id)
				.then((result: Room[] | any) => {
					if (result.length > 0) {
						setMessages(result.map((e: any) => JSON.parse(e.data))[0]?.messages);
						setPending(false)
					}
				})
				.catch(error => {
					console.log(error);
					setPending(false)
				});
		});
		if (roomId) {
			getRoom(roomId)
				.then((result: Room[] | any) => {
					if (result.length > 0) {
						setMessages(result.map((e: any) => JSON.parse(e.data))[0]?.messages);
						setPending(false)
					}
				})
				.catch(error => {
					console.log(error);
					setPending(false)
				});
		};
		setPending(false);
		return () => {
			socket?.off('findRoomResponse');
		}
	}, []);

	useFocusEffect(
		useCallback(() => {
			socket?.emit('isUserInRoom', { user: user.name, status: true });
			socket?.on('isUserInRoomResponse', (res) => {
				setIsInRoom(res.status)
			});
			return () => {
				socket?.emit('isUserInRoom', { user: user.name, status: false });
				socket?.off('isUserInRoomResponse');
			}
		}, [socket])
	);

	const onSend = (newMessage: IMessage[]) => {
		if ((!status || !isInRoom)) return;
		if (socket && roomId) {
			socket.emit('sendMessage', { ...newMessage[0], user, roomId },setMessages((prevMessages: IMessage[]) => GiftedChat.append(prevMessages, [...newMessage])));
			// console.log('onSend',JSON.stringify(newMessage),'newMessage')
			// setMessages((prevMessages: IMessage[]) => GiftedChat.append(prevMessages, [...newMessage]));
		}
	};


	return (
		<View style={{ flex: 1, backgroundColor: colors.background }}>
			<LoadingPage active={isPending} />
			<PushNotificationSend active={contact?.token && (status === false || isInRoom === false)} user={user} contactToken={contact?.token} roomId={roomId} />
			<View style={{ flexDirection: 'row', padding: 15, alignItems: "center", backgroundColor: colors.undetlay }}>
				<View style={{ width: 47, height: 47, borderRadius: 25, backgroundColor: colors.border, marginRight: 10 }} />
				<View style={{ alignItems: "flex-start", flexDirection: "column" }}>
					<Text style={{ color: colors.text, fontSize: 23, fontWeight: "700" }}>{contact ? contact.name : ''}</Text>
					<View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
						<Text style={{ color: colors.text, fontSize: 17, fontWeight: "600", paddingBottom: 2 }}>{status === true ? "online" : status === false ? "offline" : "connecting..."}</Text>
						<Text style={{ color: colors.text, fontSize: 14, fontWeight: "500" }}>{isInRoom === false && status === true ? "but not in room" : ""}</Text>
					</View>
				</View>
			</View>
			<GiftedChat
				messages={messages}
				onSend={messages => onSend(messages)}
				user={user}
				renderMessageVideo={renderMessageVideo}
				alwaysShowSend
				scrollToBottom
				loadEarlier
				renderUsernameOnMessage
				infiniteScroll
				inverted={true}
				renderActions={(e) => renderActions(e, { setOpen, open, colors })}
				renderBubble={(e) => renderBubble(e,{colors})}
				renderSend={(e) => renderSend(e, { colors })}
				renderChatFooter={() => RenderChatFooter({ user, socket, translateY, roomId,setMessages, colors })}
				renderInputToolbar={(e) => renderInputToolbar(e, { colors })}
				renderTime={(e)=>renderTime(e,{colors})}
			/>
		</View>
	);
};

export default Messaging;