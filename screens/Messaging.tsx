import React, { useState, useEffect } from 'react'
import { GiftedChat, IMessage } from 'react-native-gifted-chat'
import socket from "../utils/socket";
import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList } from '../utils/types';
import { View } from 'react-native';


const Messaging = ({ route }: StackScreenProps<RootStackParamList, 'Messaging'>) => {
	const { user, contact } = route.params;
	const [chatMessages, setChatMessages] = useState<IMessage[]>([]);

	function setter(value: IMessage[]) {
		setChatMessages(value)
	}

	const handleNewMessage = (messages: IMessage[]) => {
		socket.emit("newMessage", { names: [user, contact], text: messages[0]?.text, user, createdAt: messages[0]?.createdAt, id: messages[0]?._id });
	};

	useEffect(() => {
		socket.emit("findRoom", [user, contact]);
		socket.on("findRoom", setter);
		// console.log('object');
		return () => {
			socket.off("findRoom", setter);
		}
	}, [socket,chatMessages]);

	// useEffect(() => {
	// 	socket.on("newMessage", setter);
	// 	// console.log('counter');
	// 	return () => {socket.off("new")}
	// },[socket,chatMessages]);

	return (
		// <View style={{backgroundColor:"red"}}>
		<GiftedChat
			messages={chatMessages}
			onSend={messages => handleNewMessage(messages)}
			user={user}
			alwaysShowSend
			scrollToBottom
			loadEarlier
			renderUsernameOnMessage
			infiniteScroll
			inverted={false}
			/>
		// {/* </View> */}
	);
};

export default Messaging;