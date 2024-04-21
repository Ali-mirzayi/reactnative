import React, { useState, useEffect } from 'react'
import { GiftedChat, IMessage } from 'react-native-gifted-chat'
import { StackScreenProps } from "@react-navigation/stack";
import { Room, RootStackParamList } from '../utils/types';
import { useSocket, useUser } from '../socketContext';
import { UpdateMessage, getRoom } from '../utils/DB';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import * as FileSystem from 'expo-file-system';
import { downloadsDir, ensureDirExists } from '../utils/directories';
import LoadingPage from '../components/LoadingPage';
import { renderActions, renderBubble, RenderChatFooter, renderInputToolbar, renderMessageVideo, renderSend } from '../components/Message';
import useTheme from '../utils/theme';
import { Text, View } from 'react-native';

const Messaging = ({ route }: StackScreenProps<RootStackParamList, 'Messaging'>) => {
	const { contact, id }: any = route.params;
	const [messages, setMessages] = useState<IMessage[]>([]);
	const [roomId, setRoomId] = useState<string | any>(id);
	const [open, setOpen] = useState<boolean>(false);
	const [status, setStatus] = useState<boolean | undefined>(undefined);
	const user: any = useUser(state => state.user)
	const translateY = useSharedValue(1000);
	const [isPending, setPending] = useState(true);
	const socket = useSocket(state => state.socket);
	const { colors } = useTheme();

	useEffect(() => {
		if (socket) {
			socket.emit('checkStatus', contact.name );
			socket.on('checkStatusResponse', (res) => {
				setStatus(res.status)
			});
			// console.log(socket.id, 'socket connected id');
			// console.log(contact);
			// socket.emit('checkStatus', { 'id': socket.id, 'roomId': roomId, 'name': user.name });
			// socket.on('checkStatusResponse',(res)=>{
			// 	()=>console.log(res,'resssss');
			// 	if(res.name===contact.name){
			// 		setStatus(res.status)
			// 	}
			// });
			// console.log(status, 'status');
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
					newMessage["image"] = filename;
					// setUri(filename);
				};
				console.log(newMessage);
				setMessages((prevMessages: IMessage[]) => GiftedChat.append(prevMessages, [newMessage]));
			});
			return () => {
				socket.off('newMessage');
				socket.off('checkStatusResponse');
				// socket.off('checkStatusResponse');
			}
		}
	}, [socket,status]);

	// useEffect(() => {
	// 	if (socket) {
	// 		socket.emit('checkStatus', contact.name );
	// 		socket.on('checkStatusResponse', (res) => {
	// 			setStatus(res.status)
	// 		});
	// 		 return () => {
	// 			socket.off('checkStatusResponse')
	// 		}
	// 	}
	// }, [status, socket]);

	useEffect(() => {
		if (isPending == false) {
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
		if (socket) {
			socket.emit('findRoom', [user, contact]);
			socket.on('findRoomResponse', (room: Room) => {
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
		};
		if (roomId && socket) {
			getRoom(roomId)
				.then((result: Room[] | any) => {
					if (result.length > 0) {
						console.log('socket disabled');
						setMessages(result.map((e: any) => JSON.parse(e.data))[0]?.messages);
						setPending(false)
					}
				})
				.catch(error => {
					console.log(error);
					setPending(false)
				});
		};
		return () => {
			socket?.off('findRoomResponse');
		}
	}, []);

	const onSend = (newMessage: IMessage[]) => {
		if (socket && roomId) {
			socket.emit('sendMessage', { ...newMessage[0], user, roomId });
		}
	};

	return (
		<View style={{ flex: 1, backgroundColor: colors.background }}>
			<LoadingPage active={isPending} />
			<View style={{ flexDirection: 'row', padding: 15, alignItems: "center", backgroundColor: colors.undetlay }}>
				<View style={{ width: 45, height: 45, borderRadius: 25, backgroundColor: colors.border, marginRight: 10 }} />
				<View style={{ alignItems: "flex-start", flexDirection: "column" }}>
					<Text style={{ color: colors.text, fontSize: 23 }}>{contact ? contact.name : ''}</Text>
					<Text style={{ color: colors.text, fontSize: 16 }}>{status ? "online" : status === false ? "offline" : "connecting..."}</Text>
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
				renderBubble={renderBubble}
				renderSend={(e) => renderSend(e, { colors })}
				renderChatFooter={() => RenderChatFooter({ user, socket, translateY, roomId, colors })}
				renderInputToolbar={(e) => renderInputToolbar(e, { colors })}
			/>
		</View>
	);
};

export default Messaging;