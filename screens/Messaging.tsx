import React, { useState, useEffect, useLayoutEffect, useCallback, useContext } from 'react'
import { Actions, ActionsProps, Bubble, BubbleProps, GiftedChat, IMessage, MessageImage, MessageImageProps } from 'react-native-gifted-chat'
import { StackScreenProps } from "@react-navigation/stack";
import { Room, RootStackParamList } from '../utils/types';
import { socketContext } from '../socketContext';
import { Foundation } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@react-navigation/native';
import { generateID } from '../utils/utils';


const Messaging = ({ route }: StackScreenProps<RootStackParamList, 'Messaging'>) => {
	const { contact } = route.params;
	const [messages, setMessages] = useState<IMessage[]>([]);
	const { socket, user }: any = useContext(socketContext);
	const [roomId, setRoomId] = useState<string | undefined>(undefined);
	const { colors } = useTheme();

	const handlePickImage = async () => {
		let result = await ImagePicker.launchImageLibraryAsync({
			base64: true,
			mediaTypes: ImagePicker.MediaTypeOptions.All,
			allowsEditing: true,
			quality: 1,
			cameraType: ImagePicker.CameraType.back,
			videoQuality: 1,
			// allowsMultipleSelection: true,
		});
		// console.log(result);
		if (!result.canceled) {
			sendImage(result.assets[0].base64)
		}
	};

	function sendImage(image: string | null | undefined) {
		const id = generateID();
		// console.log(image);
		socket.emit('sendMessage', { _id: id, text: "", createdAt: new Date(),image:'data:image/jpeg;base64,'+image, user, roomId });
		// socket.emit("newMessage", { names: [user, contact], _id: id, text: "", createdAt: new Date(), user, image });
	};

	function renderActions(props: Readonly<ActionsProps>) {
		return (
			<Actions
				{...props}
				icon={() => (
				<Foundation name="paperclip" size={24} color="black" />)}
				onPressActionButton={handlePickImage}
			/>
		)
	};

	// function renderMessageImage(props:MessageImageProps<IMessage>){
	// 	return(
	// 		<MessageImage 
	// 		imageProps={{uri:""}}
	// 		/>
	// 	)
	// }

	const renderBubble = (props :Readonly<any>) => {
		return (
		  <Bubble
			{...props}
			containerStyle={{
				right: {
					borderBottomRightRadius: 0,
				},
				left:{
				    borderBottomLeftRadius: 0,
				}
			}}
			containerToPreviousStyle={{
				right: {
					borderBottomRightRadius: 0,
				},
				left:{
				    borderBottomLeftRadius: 0,
				}
			}}
			wrapperStyle={{
				right: {
					// backgroundColor: 'green',
					// borderBottomRightRadius: 0,
					// borderBottomLeftRadius: 15,
					borderTopRightRadius: 15,
					borderTopLeftRadius: 15,
					marginVertical: 2
				  },
				  left: {
					backgroundColor: 'blue',
					// borderBottomRightRadius: 15,
					// borderBottomLeftRadius: 0,
					borderTopRightRadius: 15,
					borderTopLeftRadius: 15,
					marginVertical: 1
				  }
			}}
			  containerToNextStyle={{
				right: {
					borderBottomRightRadius: 15,
					borderBottomLeftRadius: 15,
					borderTopRightRadius: 15,
					borderTopLeftRadius: 15,
				 },
				left: {
					borderBottomRightRadius: 15,
					borderBottomLeftRadius: 15,
					borderTopRightRadius: 15,
					borderTopLeftRadius: 15,
				 },
			  }}
			textStyle={{
			  right: {
				color: '#fff',
			  },left:{
				color: '#fff',
			  }
			}}
		  />
		);
	  };

	useEffect(() => {
		if (socket) {
			// Listen for new messages from the server
			socket.on('newMessage', (newMessage: IMessage[]) => {
				setMessages((prevMessages: IMessage[]) => GiftedChat.append(prevMessages, newMessage));
			});
			console.log(messages);
			// console.log(roomId,'roomId');
			return () => {
				socket.off('findRoomResponse')
			}
		}
	}, [socket]);

	useEffect(() => {
		if (socket) {
			socket.emit('findRoom', [user, contact]);
			socket.on('findRoomResponse', (room: Room) => {
				setRoomId(room.id);
				setMessages(room.messages);
			});
			return () => {
				socket.off('findRoomResponse')
			}
		}
	}, []);

	const onSend = (newMessage: IMessage[]) => {
		if (socket) {
			console.log(roomId, 'roomId');
			socket.emit('sendMessage', { ...newMessage[0], user, roomId });
		}
	};

	return (
		<SafeAreaView style={{backgroundColor:colors.background,flex:1}}>
		<GiftedChat
			messages={messages}
			onSend={messages => onSend(messages)}
			user={user}
			alwaysShowSend
			scrollToBottom
			loadEarlier
			renderUsernameOnMessage
			infiniteScroll
			inverted={true}
			renderActions={renderActions}
			renderBubble={renderBubble}
			alignTop
			// renderMessageImage={renderMessageImage}
			/>
		</SafeAreaView>
	);
};

export default Messaging;