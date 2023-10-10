import React, { useState, useEffect, useContext } from 'react'
import { Actions, ActionsProps, Bubble, BubbleProps, GiftedChat, IMessage, MessageVideoProps, Send, SendProps } from 'react-native-gifted-chat'
import { StackScreenProps } from "@react-navigation/stack";
import { Room, RootStackParamList } from '../utils/types';
import { socketContext } from '../socketContext';
import { Feather,Ionicons,Entypo } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { generateID } from '../utils/utils';
import { UpdateMessage, getRoom } from '../utils/DB';
import { Video, ResizeMode } from 'expo-av';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import * as FileSystem from 'expo-file-system';
import baseURL from '../utils/baseURL';
import { downloadsDir, ensureDirExists } from '../utils/directories';

const Messaging = ({ route }: StackScreenProps<RootStackParamList, 'Messaging'>) => {
	const { contact,id } = route.params;
	const [messages, setMessages] = useState<IMessage[]>([]);
	const [roomId, setRoomId] = useState<string | any>(id);
	const { socket, user }: any = useContext(socketContext);
	const [open,setOpen] = useState<Boolean>(false);
	const { colors } = useTheme();
	const animation = useSharedValue(0);
	const animationStyle = useAnimatedStyle(() => {
        return {
            marginBottom: animation.value == 1 ? withTiming(-300, { duration: 500 }) : withTiming(-700, { duration: 1000 })
        }
    });

	const handleCamera = async () => {
		await ImagePicker.requestCameraPermissionsAsync();
		let result = await ImagePicker.launchCameraAsync({
			base64: true,
			mediaTypes: ImagePicker.MediaTypeOptions.All,
			allowsEditing: true,
			quality:1,
			preferredAssetRepresentationMode:ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Current
		});
		if (!result.canceled) {
			sendMedia({uri:result.assets[0].uri,type:result.assets[0].type});
		};
	};

	const handlePickImage = async () => {
		let result = await ImagePicker.launchImageLibraryAsync({
			base64: true,
			mediaTypes: ImagePicker.MediaTypeOptions.All,
			allowsEditing: true,
			quality: 1,
			videoQuality: 1,
		});
		if (!result.canceled) {
			sendMedia({uri:result.assets[0].uri,type:result.assets[0].type});
		}
	};

	async function sendMedia({uri,type}:{uri:string | null | undefined,type:"image" | "video" | undefined}) {
		const id = generateID();
		console.log(uri,type);
		if (type==='image' && uri){
			const response = await FileSystem.uploadAsync(`${baseURL()}/upload`,uri,{uploadType:FileSystem.FileSystemUploadType.MULTIPART,httpMethod: 'POST',fieldName:'file'})
			console.log(JSON.stringify(response.body, null, 4));
			socket.emit('sendImage', { _id: id, text: "", createdAt: new Date(), user, roomId });
			// socket.emit('sendMessage', { _id: id, text: "", createdAt: new Date(),image:'data:image/jpeg;base64,'+uri, user, roomId });
		}else if (type==='video' && uri){
			const response = await FileSystem.uploadAsync(`${baseURL()}/upload`,uri,{uploadType:FileSystem.FileSystemUploadType.MULTIPART,httpMethod: 'POST',fieldName:'file'})
			socket.emit('sendVideo', { _id: id, text: "", createdAt: new Date(), user, roomId });
			// socket.emit('sendMessage', { _id: id, text: "", createdAt: new Date(),video:'data:video/mp4;base64,'+uri, user, roomId });	
		}
		// if (roomId){
		// 	UpdateMessage({id:roomId,users:[user,contact],messages:messages});
		// }
	};

	function renderActions(props: Readonly<ActionsProps>) {
		return (
			<Actions
				{...props}
				icon={() => (
				<Feather name="paperclip" style={{marginTop:2}} size={24} color={colors.primary} />
				)}
				// onPressActionButton={handlePickImage}
				onPressActionButton={()=>setOpen(!open)}
			/>
		)
	};

	function renderSend(props: SendProps<IMessage>) {
       return(<View style={{flexDirection: 'row',alignItems:"center"}}>
			<Send {...props}>
				  <Ionicons style={styles.sendIcon} name="send" size={27} color={colors.primary} />
            </Send>
		</View>)
	};

	function renderChatFooter(){
		return(<Animated.View style={[styles.footerChatOpen,animationStyle]}>
			<View style={[styles.iconContainer,{backgroundColor:colors.background}]}>
			    <Ionicons name='camera' style={[styles.cameraIcon]} size={30} color={colors.primary} onPress={handleCamera} />
			</View>
			<View style={[styles.iconContainer,{backgroundColor:colors.background}]}>
			    <Entypo name='images' style={[styles.cameraIcon]} size={30} color={colors.primary} onPress={handlePickImage} />
			</View>
			<View style={[styles.iconContainer,{backgroundColor:colors.background}]}>
			    <Feather name='file' style={[styles.cameraIcon]} size={30} color={colors.primary}/>
			</View>
			<View style={[styles.iconContainer,{backgroundColor:colors.background}]}>
			    <Feather name='mic' style={[styles.cameraIcon]} size={30} color={colors.primary} />
			</View>
		</Animated.View>)
	}

	const renderBubble = (props :Readonly<BubbleProps<IMessage>>) => {
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
					borderTopRightRadius: 15,
					borderTopLeftRadius: 15,
					marginVertical: 2
				  },
				  left: {
					backgroundColor: 'blue',
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

	 function renderMessageVideo (props: MessageVideoProps<IMessage>) {
		return(<View style={{ padding: 20 }}>
			<Video 
			    // @ts-ignore
			    source={{uri: props.currentMessage?.video}}
				resizeMode={ResizeMode.CONTAIN}
				useNativeControls
				shouldPlay={false}
				style={{width:220,height:400}}
			/>
		</View>)
	 }
	  
	useEffect(() => {
		if (socket) {
			// Listen for new messages from the server
			socket.on('newMessage', async(newMessage: IMessage) => {
				// if (newMessage.image){
				// 	// await ensureDirExists();
				// 	// const base64Code = newMessage.image.replace('data:image/jpeg;base64,','');
				// 	const base64Code = newMessage.image.split("data:image/jpeg;base64,")[1];
				// 	// console.log(base64Code.slice(0,90));
				// 	const filename = downloadsDir + new Date().getTime() + ".jpeg";
				// 	await FileSystem.writeAsStringAsync(filename,base64Code,{encoding:"base64"});
				// 	console.log(filename);
				// }
				
				setMessages((prevMessages: IMessage[]) => GiftedChat.append(prevMessages, [newMessage]))
			});
			return () => {
				socket.off('findRoomResponse')
			}
		}
	}, [socket]);

	useEffect(()=>{
		UpdateMessage({id:roomId,users:[user,contact],messages});
		if(messages[messages.length-1]){
			// console.log(messages[messages.length-1]);
		}
	},[messages]);
	
	// UpdateMessage({id:roomId,users:[user,contact],messages:[newMessage[0],...messages]});

		useEffect(() => {
		if(open === true) {
			animation.value = 1;
		}else {
			animation.value = 0;
		}
	},[open])

	useEffect(() => {
		if (socket) {
			socket.emit('findRoom', [user, contact]);
			socket.on('findRoomResponse', (room: Room) => {
				setRoomId(room.id);
				getRoom(room.id)
				.then((result:Room[] | any) => {
					if (result.length > 0) {
						console.log('socket get');
						setMessages(result.map((e:any)=>JSON.parse(e.data))[0]?.messages);
					}
				})
				.catch(error => {
					console.log(error);
				});
			});
		};
		if (roomId && !socket){
			getRoom(roomId)
			 .then((result:Room[] | any) => {
				if (result.length > 0) {
					console.log('socket disabled');
					// console.log(result.map((e:any)=>JSON.parse(e.data))[0].messages);
					setMessages(result.map((e:any)=>JSON.parse(e.data))[0]?.messages);
				}
			})
			.catch(error => {
				console.log(error);
			});
		};
		return () => {
			socket?.off('findRoomResponse');
		}
	}, []);

	const onSend = (newMessage: IMessage[]) => {
		if (socket && roomId) {
			socket.emit('sendMessage', { ...newMessage[0], user, roomId });
			// UpdateMessage({id:roomId,users:[user,contact],messages:[newMessage[0],...messages]})
			// console.log(`MESSAGE ==================${JSON.stringify([newMessage[0],...messages])}================ MESSAGE`);
		}
	};


	return (
		<SafeAreaView style={{backgroundColor:colors.background,flex:1,position:"relative"}}>
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
			renderActions={renderActions}
			renderBubble={renderBubble}
			renderSend={renderSend}
			renderChatFooter={renderChatFooter}
			/>
		</SafeAreaView>
	);
};

export default Messaging;

const styles = StyleSheet.create({
	sendIcon:{
		marginBottom: 6,
		marginRight: 8,
		height: "auto"
		},
	cameraIcon:{
	    // marginRight: 10,
	},
	footerChatOpen:{
		shadowColor: '#1F2687',
		shadowOpacity: 0.37,
		shadowRadius: 8,
		shadowOffset: {width: 0, height: 8},
		elevation: 8,
		borderTopLeftRadius: 10,
		borderTopRightRadius: 10,
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.18)',
		flexDirection: 'row',
		// alignItems: 'center',
		justifyContent: 'space-around',
		paddingHorizontal:10,
		paddingTop: 15,
		backgroundColor: '#fff',
		height: 380,
		position:'absolute',
		bottom:0,
		right: 0,
		left: 0,
	},
	footerChatClose:{
		marginBottom:-20
	},
	iconContainer: {
		width: 50,
		height:50,
		justifyContent:'center',
		alignItems: 'center',
		borderRadius: 50,
	}
});
