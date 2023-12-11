import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { Feather, Ionicons, Entypo } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { generateID } from "../utils/utils";
import baseURL from "../utils/baseURL";
import * as FileSystem from 'expo-file-system';
import { useContext } from "react";
import { socketContext } from "../socketContext";
import { useTheme } from "@react-navigation/native";
import { Actions, ActionsProps, Bubble, BubbleProps, IMessage, MessageVideoProps, Send, SendProps } from "react-native-gifted-chat";
import { ResizeMode, Video } from "expo-av";


export function renderChatFooter({translateY,roomId}:any) {
	const { socket, user }: any = useContext(socketContext);
	const { colors } = useTheme();
	async function sendMedia({ uri, type }: { uri: string | null | undefined, type: "image" | "video" | undefined }) {
		const id = generateID();
		// console.log(uri, type);
		if (type === 'image' && uri) {
			const response = await FileSystem.uploadAsync(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file' })
			socket.emit('sendImage', { _id: id, text: "", createdAt: new Date(), user, roomId });
			// socket.emit('sendMessage', { _id: id, text: "", createdAt: new Date(),image:'data:image/jpeg;base64,'+uri, user, roomId });
		} else if (type === 'video' && uri) {
			const response = await FileSystem.uploadAsync(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file' })
			socket.emit('sendVideo', { _id: id, text: "", createdAt: new Date(), user, roomId });
			// socket.emit('sendMessage', { _id: id, text: "", createdAt: new Date(),video:'data:video/mp4;base64,'+uri, user, roomId });	
		}
		// if (roomId){
		// 	UpdateMessage({id:roomId,users:[user,contact],messages:messages});
		// }
	};
	
	const handleCamera = async () => {
		await ImagePicker.requestCameraPermissionsAsync();
		let result = await ImagePicker.launchCameraAsync({
			base64: true,
			mediaTypes: ImagePicker.MediaTypeOptions.All,
			allowsEditing: true,
			quality: 1,
			preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Current
		});
		if (!result.canceled) {
			sendMedia({ uri: result.assets[0].uri, type: result.assets[0].type });
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
			sendMedia({ uri: result.assets[0].uri, type: result.assets[0].type });
		}
	};

	return (<Animated.View style={{ transform:[{translateY}] }}>
		<View style={styles.footerChatOpen}>
			<View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
				<Ionicons name='camera' size={30} color={colors.primary} onPress={handleCamera} />
			</View>
			<View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
				<Entypo name='images' size={30} color={colors.primary} onPress={handlePickImage} />
			</View>
			<View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
				<Feather name='file' size={30} color={colors.primary} />
			</View>
			<View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
				<Feather name='mic' size={30} color={colors.primary} />
			</View>
		</View>
	</Animated.View>)
}

export const renderBubble = (props: Readonly<BubbleProps<IMessage>>) => {
	return (
		<Bubble
			{...props}
			containerStyle={{
				right: {
					borderBottomRightRadius: 0,
				},
				left: {
					borderBottomLeftRadius: 0,
				}
			}}
			containerToPreviousStyle={{
				right: {
					borderBottomRightRadius: 0,
				},
				left: {
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
				}, left: {
					color: '#fff',
				}
			}}
		/>
	);
};

export function renderMessageVideo(props: MessageVideoProps<IMessage>) {
	return (<View style={{ padding: 20 }}>
		<Video
			// @ts-ignore
			source={{ uri: props.currentMessage?.video }}
			resizeMode={ResizeMode.CONTAIN}
			useNativeControls
			shouldPlay={false}
			style={{ width: 220, height: 400 }}
		/>
	</View>)
};

export function renderSend(props: SendProps<IMessage>) {
	const { colors } = useTheme();

	return (<View style={{ flexDirection: 'row', alignItems: "center" }}>
		<Send {...props}>
			<Ionicons style={styles.sendIcon} name="send" size={27} color={colors.primary} />
		</Send>
	</View>)
};

export function renderActions(props: Readonly<ActionsProps>,{setOpen,open}:{setOpen:React.Dispatch<React.SetStateAction<boolean>>,open:boolean}) {
	const { colors } = useTheme();

	return (
		<Actions
			{...props}
			icon={() => (
				<Feather name="paperclip" style={{ marginTop: 2 }} size={24} color={colors.primary} />
			)}
			onPressActionButton={() => setOpen(!open)}
		/>
	)
};


const styles = StyleSheet.create({
	sendIcon: {
		marginBottom: 6,
		marginRight: 8,
		height: "auto"
	},
	footerChatOpen: {
		shadowColor: '#1F2687',
		shadowOpacity: 0.37,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 8 },
		elevation: 8,
		borderTopLeftRadius: 10,
		borderTopRightRadius: 10,
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.18)',
		flexDirection: 'row',
		justifyContent: 'space-around',
		paddingHorizontal: 10,
		paddingTop: 15,
		backgroundColor: '#fff',
		height: 380,
		position: 'absolute',
		bottom: 0,
		right: 0,
		left: 0,
	},
	iconContainer: {
		width: 50,
		height: 50,
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 50,
	}
});
