import React, { useState, useEffect, useRef, useCallback } from 'react'
import { GiftedChat, IMessage } from 'react-native-gifted-chat'
import { StackScreenProps } from "@react-navigation/stack";
import { IMessagePro, RecordingEnum, RootStackParamList } from '../utils/types';
import { useCurrentContact, useIsOpen, useMessage, usePlayer, usePosition, useSetLastMessage, useSocket, useUser, useVideosDuration } from '../socketContext';
import { updateMessage, getRoom } from '../utils/DB';
import { useSharedValue, withTiming, } from 'react-native-reanimated';
import LoadingPage from '../components/LoadingPage';
import { renderActions, renderBubble, RenderChatFooter, renderInputToolbar, renderMessageAudio, renderMessageFile, RenderMessageImage, renderMessageVideo, renderSend, renderTime } from '../components/Message';
import useTheme from '../utils/theme';
import { Animated, PanResponder, Text, View } from 'react-native';
import PushNotificationSend from '../components/SendPushNotification';
import { Audio } from 'expo-av';
import FloatingMusicPlayer from '../components/FloatingMusicPlayer';
import { cancelRecording, stopRecording } from '../components/SendMedia';
import useAudioPlayer from '../hooks/useAudioPlayer';

const Messaging = ({ route }: StackScreenProps<RootStackParamList, 'Messaging'>) => {
	const { contact, roomId }: any = route.params;

	const { messages, setMessages } = useMessage();
	const [open, setOpen] = useState<boolean>(false); // renderChatFooter
	const [status, setStatus] = useState<boolean | undefined>(undefined); // connection
	const [recording, setRecording] = useState<undefined | { playing: boolean, status: RecordingEnum }>();
	const [isInRoom, setIsInRoom] = useState<boolean>(true);
	const [isPending, setPending] = useState(true); // set for roomId and save it db

	const socket = useSocket(state => state.socket);
	const user: any = useUser(state => state.user);

	const { lastMessage, setLastMessage } = useSetLastMessage();
	const { open: isPlayerOpen, setOpen: setIsOpen } = useIsOpen();
	const setContact = useCurrentContact(state => state.setContact);
	const { startPlayingByItem, stopPlaying } = useAudioPlayer();
	const { videosDuration, setVideosDuration } = useVideosDuration();

	const translateY = useSharedValue(1000);
	const { colors } = useTheme();
	const videoRef: any = useRef(null);
	const [permissionResponse, requestPermission] = Audio.usePermissions();
	const pan = useRef(new Animated.Value(0)).current;

	const panResponder = useRef(
		PanResponder.create({
			onMoveShouldSetPanResponder: () => true,
			onPanResponderMove: Animated.event([null, { dy: pan }], { useNativeDriver: false }),
			onPanResponderRelease: (evt, gestureState) => {
				if (gestureState.dy <= -50 && gestureState.dy >= -110) {
					(async () => {
						await cancelRecording({ recording, setRecording });
					})();
				} else {
					(async () => {
						await stopRecording({ recording, setRecording, roomId, setMessages, socket, user });
					})();
				}
				Animated.spring(
					pan,
					{ toValue: 0, useNativeDriver: true },
				).start();
			},
			// onPanResponderTerminate: (evt, gestureState) => {
			// 	pan.flattenOffset();
			// 	pan.extractOffset();
			// 	pan.removeAllListeners();
			// 	pan.resetAnimation();
			// },
		})
	).current;

	if (open === true) {
		translateY.value = withTiming(300, { duration: 400 });
	} else {
		translateY.value = withTiming(700, { duration: 1000 });
	}

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
			socket.emit('isUserInRoom', { userId: user._id, contactId: contact._id, userRoomId: roomId });
			socket.on('checkStatusResponse', (res: { status: boolean, isInRoom: boolean }) => {
				setStatus(res.status);
				setIsInRoom(res.isInRoom);
			});
			socket.on('isUserInRoomResponse', (res) => {
				setIsInRoom(res)
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
				socket?.emit('isUserInRoom', { userId: user._id, contactId: contact._id, userRoomId: undefined });
				socket?.off('isUserInRoomResponse');
			}
		}
	}, [socket]);

	useEffect(() => {
		if (isPending == false) {
			updateMessage({ id: roomId, users: [user, contact], messages });
		}
	}, [messages]);

	useEffect(() => {
		setPending(true);
		getRoom(roomId)
			.then((result) => {
				if (result.length > 0) {
					const roomMessage: IMessagePro[] = result.map((e: any) => JSON.parse(e.data))[0]?.messages;
					setMessages(() => roomMessage.map(e => ({ ...e, playing: false })));
					setPending(false);
				}
			}).catch(error => {
				console.log(error, 'v2');
				setPending(false)
			});
		setPending(false);
	}, [lastMessage]);

	useEffect(() => {
		setContact(contact);
	}, []);

	const all = "asd"

	const shouldUpdateMessage = useCallback((currentProps: any, nextProps: any) => {
		console.log('shouldUpdateMessage')
		if (currentProps.previousMessage !== nextProps.nextMessage) {
			return true
		}
		return false
	}, [all]);

	const onSend = (newMessage: IMessagePro[]) => {
		if ((!socket)) return;
		// if ((!status || !socket)) return;
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
			{isPlayerOpen ?
				<FloatingMusicPlayer />
				: null}
			<GiftedChat
				messages={messages}
				onSend={messages => onSend(messages)}
				user={user}
				renderMessageImage={(e: any) => RenderMessageImage(e, { setMessages, colors })}
				renderMessageVideo={(e: any) => renderMessageVideo(e, { setMessages, colors, videoRef, videosDuration, setVideosDuration })}
				renderMessageAudio={(e: any) => renderMessageAudio(e, { setMessages, colors, setIsOpen, startPlayingByItem, stopPlaying })}
				renderCustomView={(e: any) => renderMessageFile(e, { setMessages, colors })}
				alwaysShowSend
				scrollToBottom
				loadEarlier
				infiniteScroll
				inverted={true}
				renderActions={(e) => renderActions(e, { setOpen, open, colors })}
				renderBubble={(e) => renderBubble(e, { colors })}
				renderSend={(e) => renderSend(e, { colors })}
				renderChatFooter={() => RenderChatFooter({ user, socket, translateY, roomId, setMessages, colors, recording, setRecording, handleAudioPermissions, panResponder, pan, permissionResponse, videosDuration })}
				renderInputToolbar={(e) => renderInputToolbar(e, { colors })}
				renderTime={(e) => renderTime(e, { colors })}
				optionTintColor='#fff'
				// shouldUpdateMessage={shouldUpdateMessage}
			/>
		</View>
	);
};

export default Messaging;