import React, { useState, useEffect, useCallback, useRef } from 'react'
import { GiftedChat, IMessage } from 'react-native-gifted-chat'
import { StackScreenProps } from "@react-navigation/stack";
import { IMessagePro, RecordingEnum, RootStackParamList } from '../utils/types';
import { useCurrentContact, useIsOpen, useLastTrack, usePlayer, usePosition, useSetDownloading, useSetErrors, useSetLastMessage, useSetUploading, useSocket, useUser } from '../socketContext';
import { updateMessage, getRoom } from '../utils/DB';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import LoadingPage from '../components/LoadingPage';
import { renderActions, renderBubble, RenderChatFooter, renderInputToolbar, renderMessageAudio, renderMessageFile, RenderMessageImage, renderMessageVideo, renderSend, renderTime } from '../components/Message';
import useTheme from '../utils/theme';
import { Animated, Easing, PanResponder, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import PushNotificationSend from '../components/SendPushNotification';
import { Audio } from 'expo-av';
import FloatingMusicPlayer from '../components/FloatingMusicPlayer';
import { cancelRecording, stopRecording } from '../components/SendMedia';

const Messaging = ({ route }: StackScreenProps<RootStackParamList, 'Messaging'>) => {
	const { contact, roomId }: any = route.params;

	const [messages, setMessages] = useState<IMessage[]>([]);
	const [open, setOpen] = useState<boolean>(false); // renderChatFooter
	const [status, setStatus] = useState<boolean | undefined>(undefined); // connection
	const [recording, setRecording] = useState<undefined | { playing: boolean, status: RecordingEnum }>();
	const [isInRoom, setIsInRoom] = useState<boolean>(true);
	const [isPending, setPending] = useState(true); // set for roomId and save it db

	const socket = useSocket(state => state.socket);
	const user: any = useUser(state => state.user);

	const { lastMessage, setLastMessage } = useSetLastMessage();
	const { downloading, setDownloading } = useSetDownloading();
	const { errors, setErrors } = useSetErrors();
	const { uploading, setUploading } = useSetUploading();
	const { player, setPlayer } = usePlayer();
	const { currentPosition, setCurrentPosition } = usePosition();
	const { open: isPlayerOpen, setOpen: setIsOpen } = useIsOpen();
	const setContact = useCurrentContact(state => state.setContact);

	const translateY = useSharedValue(1000);
	const { colors } = useTheme();
	const videoRef: any = useRef(null);
	const [permissionResponse, requestPermission] = Audio.usePermissions();
	const pan = useRef(new Animated.Value(0)).current;

	const panResponder = useRef(
		PanResponder.create({
			onMoveShouldSetPanResponder: () => true,
			onPanResponderMove: (evt, gestureState) => {
				if (gestureState.dy < 0) {
					pan.setValue(gestureState.dy);
				}
			},
			onPanResponderRelease: (evt, gestureState) => {
				// if (recording?.playing === true) return;
				if (gestureState.dy <= -50 && gestureState.dy >= -110) {
					(async () => {
						await cancelRecording({ recording, setRecording });
					})();
				} else {
					(async () => {
						await stopRecording({ recording, setRecording, roomId, setErrors, setMessages, setUploading, socket, user });
					})();
				}
				Animated.timing(pan, {
					toValue: 0,
					duration: 700,
					easing: Easing.bounce,
					useNativeDriver: true,
				}).start();
			},
		})
	).current;

	const handleAudioPermissions = async () => {
		try {
			if (permissionResponse?.status !== 'granted') {
				console.log('Requesting permission..');
				await requestPermission();
				return true;
			} else {
				return true;
			}
		} catch (err) {
			console.log('error to request permision', err);
			return false;
		}
	};

	const handleLastMessages = ({ roomId, newMessage }: { roomId: string, newMessage: string }) => {
		setLastMessage((prevState: any) => {
			const existingItem = prevState.find((item: any) => item.roomId === roomId);
			if (existingItem) {
				return prevState.map((item: any) =>
					item.roomId === roomId ? { ...item, message: newMessage } : item
				);
			} else {
				return [...prevState, { roomId, message: newMessage }];
			}
		})
	};

	useEffect(() => {
		if (socket) {
			socket.emit('checkStatus', { contactId: contact._id, userRoomId: roomId });
			socket.on('checkStatusResponse', (res: { status: boolean, isInRoom: boolean }) => {
				setStatus(res.status);
				setIsInRoom(res.isInRoom);
			});
			socket.on('userConnected', (res: string[]) => {
				const isContactDisconected = res.find(e => e === contact._id);
				setStatus(!!isContactDisconected);
			});
			socket.on('userDisconnected', (res: string[]) => {
				const isContactDisconected = res.find(e => e === contact._id);
				setStatus(!!isContactDisconected);
			});
			return () => {
				socket.off('newMessage');
				socket.off('checkStatusResponse');
			}
		}
	}, [socket]);

	useEffect(() => {
		if (isPending == false) {
			updateMessage({ id: roomId, users: [user, contact], messages });
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
		getRoom(roomId)
			.then((result) => {
				if (result.length > 0) {
					const roomMessage: IMessagePro[] = result.map((e: any) => JSON.parse(e.data))[0]?.messages;
					setMessages(roomMessage.map(e => ({ ...e, playing: false })));
					setPending(false);
				}
			}).catch(error => {
				console.log(error, 'v2');
				setPending(false)
			});
		setPending(false);
	}, [lastMessage]);

	useFocusEffect(
		useCallback(() => {
			socket?.emit('isUserInRoom', { userId: user._id, contactId: contact._id, userRoomId: roomId });
			socket?.on('isUserInRoomResponse', (res) => {
				setIsInRoom(res)
			});
			return () => {
				socket?.emit('isUserInRoom', { userId: user._id, contactId: contact._id, userRoomId: undefined });
				socket?.off('isUserInRoomResponse');
			};
		}, [socket])
	);

	useEffect(() => {
		setContact(contact);
	}, []);

	const onSend = (newMessage: IMessage[]) => {
		// if ((!status || !socket)) return;
		if ((!socket)) return;
		socket.emit('sendMessage', { ...newMessage[0], user, roomId }, setMessages((prevMessages: IMessage[]) => GiftedChat.append(prevMessages, [...newMessage])));
		handleLastMessages({ roomId, newMessage: newMessage[0].text })
	};

	return (
		<View style={{ flex: 1, backgroundColor: colors.background }}>
			<LoadingPage active={isPending} />
			{
				contact?.token && status === false ?
					<PushNotificationSend user={user} contactToken={contact?.token} roomId={roomId} />
					: null
			}
			{/* <PushNotificationSend active={contact?.token && status === false} user={user} contactToken={contact?.token} roomId={roomId} /> */}
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
			<View style={{ height: 40 }}>
				{isPlayerOpen ? <FloatingMusicPlayer /> : null}
			</View>
			<GiftedChat
				messages={messages}
				onSend={messages => onSend(messages)}
				user={user}
				renderMessageImage={(e: any) => RenderMessageImage(e, { setMessages, downloading, uploading, errors, setDownloading })}
				renderMessageVideo={(e: any) => renderMessageVideo(e, { setMessages, downloading, uploading, errors, setDownloading, videoRef })}
				renderMessageAudio={(e: any) => renderMessageAudio(e, { setMessages, downloading, setDownloading, uploading, errors, colors, player, setPlayer, currentPosition, setCurrentPosition, setIsOpen })}
				renderCustomView={(e: any) => renderMessageFile(e, { setMessages, downloading, setDownloading, uploading, errors, colors, player, setPlayer })}
				alwaysShowSend
				scrollToBottom
				loadEarlier
				renderUsernameOnMessage
				infiniteScroll
				inverted={true}
				renderActions={(e) => renderActions(e, { setOpen, open, colors })}
				renderBubble={(e) => renderBubble(e, { colors })}
				renderSend={(e) => renderSend(e, { colors })}
				renderChatFooter={() => RenderChatFooter({ user, socket, translateY, roomId, setMessages, colors, setUploading, setErrors, recording, setRecording, handleAudioPermissions, panResponder, pan, permissionResponse })}
				renderInputToolbar={(e) => renderInputToolbar(e, { colors })}
				renderTime={(e) => renderTime(e, { colors })}
				optionTintColor='#fff'
			/>
		</View>
	);
};

export default Messaging;