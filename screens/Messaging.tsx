import React, { useState, useEffect, useContext, useTransition } from 'react'
import { Actions, ActionsProps, Bubble, BubbleProps, GiftedChat, IMessage, MessageVideoProps, Send, SendProps } from 'react-native-gifted-chat'
import { StackScreenProps } from "@react-navigation/stack";
import { Room, RootStackParamList } from '../utils/types';
import { socketContext } from '../socketContext';
import { Feather, Ionicons, Entypo } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { generateID } from '../utils/utils';
import { UpdateMessage, getRoom } from '../utils/DB';
import { Video, ResizeMode } from 'expo-av';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import * as FileSystem from 'expo-file-system';
import baseURL from '../utils/baseURL';
import { downloadsDir, ensureDirExists } from '../utils/directories';
import LoadingPage from '../components/LoadingPage';
import { renderActions, renderBubble, renderChatFooter, renderMessageVideo, renderSend } from '../components/Message';

const Messaging = ({ route }: StackScreenProps<RootStackParamList, 'Messaging'>) => {
	const { contact, id } = route.params;
	const [messages, setMessages] = useState<IMessage[]>([]);
	const [roomId, setRoomId] = useState<string | any>(id);
	const [open, setOpen] = useState<boolean>(false);
	const { socket, user }: any = useContext(socketContext);
	const translateY = useSharedValue(1000);
	const [isPending, startTransition] = useTransition();

	useEffect(() => {
		if (socket) {
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
				setMessages((prevMessages: IMessage[]) => GiftedChat.append(prevMessages, [newMessage]))
			});
			return () => {
				socket.off('findRoomResponse')
			}
		}
	}, [socket]);

	useEffect(() => {
		UpdateMessage({ id: roomId, users: [user, contact], messages });
	}, [messages]);

	useEffect(() => {
		if (open === true) {
			translateY.value = withTiming(300, { duration: 400 });
		} else {
			translateY.value = withTiming(700, { duration: 1000 });
		}
	}, [open]);

	useEffect(() => {
		startTransition(() => {
			if (socket) {
				socket.emit('findRoom', [user, contact]);
				socket.on('findRoomResponse', (room: Room) => {
					setRoomId(room.id);
					getRoom(room.id)
						.then((result: Room[] | any) => {
							if (result.length > 0) {
								console.log('socket get');
								setMessages(result.map((e: any) => JSON.parse(e.data))[0]?.messages);
							}
						})
						.catch(error => {
							console.log(error);
						});
				});
			};
			if (roomId && socket) {
				getRoom(roomId)
					.then((result: Room[] | any) => {
						if (result.length > 0) {
							console.log('socket disabled');
							setMessages(result.map((e: any) => JSON.parse(e.data))[0]?.messages);
						}
					})
					.catch(error => {
						console.log(error);
					});
			};
		})
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
		<>
			<LoadingPage active={isPending} />
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
				renderActions={(e)=>renderActions(e,{setOpen,open})}
				renderBubble={renderBubble}
				renderSend={renderSend}
				renderChatFooter={()=>renderChatFooter({translateY,roomId})}
			/>
		</>
	);
};

export default Messaging;