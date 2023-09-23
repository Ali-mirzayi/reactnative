import React, { useState, useEffect, useLayoutEffect,useCallback } from 'react'
import { Actions, ActionsProps, Bubble, BubbleProps, GiftedChat, IMessage } from 'react-native-gifted-chat'
import socket from "../utils/socket";
import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList } from '../utils/types';
import { Foundation } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@react-navigation/native';
import { generateID } from '../utils/utils';

const Messaging = ({ route,navigation }: StackScreenProps<RootStackParamList, 'Messaging'>) => {
	const { user, contact } = route.params;
	const [chatMessages, setChatMessages] = useState<IMessage[]>([]);
	const { colors } = useTheme();

	const handlePickImage = async () => {
		let result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.All,
			allowsEditing: true,
			quality: 1,
			cameraType: ImagePicker.CameraType.back,
			videoQuality: 1,
			// allowsMultipleSelection: true,
			// base64: 
		});
		if (!result.canceled) {
			sendImage(result?.assets[0]?.uri)
		}
	};

	function sendImage(image: string) {
		const id = generateID();
		socket.emit("newMessage", { names: [user, contact],_id:id,text: "",createdAt: new Date(),user,image });
	  }

	function renderActions(props: Readonly<ActionsProps>) {
		return (
			<Actions
				{...props}
				icon={() => (
				<Foundation name="paperclip" size={24} color="black" />)}
				onPressActionButton={handlePickImage}
			/>
		)
	}

	const renderBubble = (props :Readonly<any>) => {
		return (
		  <Bubble
			{...props}
			wrapperStyle={{
			  right: {
				backgroundColor: 'green',
			  },
			  left: {
				backgroundColor: 'blue',
			  }
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

	const setter = (value: IMessage[]) =>{
		setChatMessages(value)
	}

	const onSend = useCallback(
		(messages: IMessage[])=>{
		socket.emit("newMessage", { names: [user, contact], text: messages[0]?.text, user, createdAt: messages[0]?.createdAt, _id: messages[0]?._id, sent: messages[0]?.sent, received: messages[0]?.received, pending: messages[0]?.pending, quickReplies: messages[0]?.quickReplies},setChatMessages(prev=>GiftedChat.append(prev,messages)));
	},[]);

	console.log('object');

	useEffect(() => {
		socket.on("newMessageResponse", setter);
		return () => {
			socket.off("newMessageResponse", setter);
		}
	}, [socket,setter]);
	
	useLayoutEffect(() => {
		navigation.setOptions({
			headerShown: true,
			headerTitle: contact?.name,
		});
		socket.emit("findRoom", [user, contact]);
		socket.on("findRoomResponse", setter);
		return () => {
			socket.off("findRoomResponse", setter);
		}
	}, []);

	// useEffect(() => {
	// 	socket.on("newMessage", setter);
	// 	// console.log('counter');onSendhandleNewMessage
	// 	return () => {socket.off("new")}
	// },[socket,chatMessages]);

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
			<StatusBar style='auto' />
			<GiftedChat
				messages={chatMessages}
				onSend={messages => onSend(messages)}
				user={user}
				alwaysShowSend
				scrollToBottom
				loadEarlier
				renderUsernameOnMessage
				infiniteScroll
				inverted={false}
				renderActions={renderActions}
				renderBubble={renderBubble}
			// isTyping={true}
			/>
		</SafeAreaView>
	);
};

export default Messaging;