import { Image, ImageSourcePropType, Pressable, StyleSheet, TouchableHighlight, View } from "react-native";
import Animated from "react-native-reanimated";
import { Feather, Ionicons, Entypo } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { generateID } from "../utils/utils";
import baseURL from "../utils/baseURL";
import * as FileSystem from 'expo-file-system';
import { Actions, ActionsProps, Bubble, BubbleProps, Composer, GiftedChat, IMessage, InputToolbar, InputToolbarProps, MessageImage, MessageImageProps, MessageVideoProps, Send, SendProps, Time, TimeProps } from "react-native-gifted-chat";
import { ResizeMode, Video } from "expo-av";
import { darkTheme } from "../utils/theme";
import { User } from "../utils/types";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { fileDirectory } from "../utils/directories";
import Lightbox from 'react-native-lightbox-v2';

export function RenderChatFooter({ user, socket, translateY, roomId, setMessages, colors }: { user: User, socket: any, translateY: any, roomId: any, setMessages: React.Dispatch<React.SetStateAction<IMessage[]>>, colors: typeof darkTheme.colors }) {
	async function sendMedia({ uri, type }: { uri: string | null | undefined, type: "image" | "video" | undefined }) {
		const id = generateID();
		if (type === 'image' && uri) {
			setMessages((prevMessages: IMessage[]) => GiftedChat.append(prevMessages, [{ _id: id, text: "", createdAt: new Date(), user, image: uri }]));
			const response = await FileSystem.uploadAsync(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file' });
			if (response.body === "ok") {
				socket?.emit('sendImage', { _id: id, text: "", createdAt: new Date(), user, roomId });
			}
		} else if (type === 'video' && uri) {
			setMessages((prevMessages: IMessage[]) => GiftedChat.append(prevMessages, [{ _id: id, text: "", createdAt: new Date(), user, video: uri }]));
			const response = await FileSystem.uploadAsync(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file' })
			if (response.body === "ok") {
				socket?.emit('sendVideo', { _id: id, text: "", createdAt: new Date(), user, roomId });
			}
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

	return (
		<Animated.View style={{ transform: [{ translateY }] }}>
			<View style={[styles.footerChatOpen, { backgroundColor: colors.card }]}>
				<TouchableHighlight onPress={handleCamera} underlayColor={colors.undetlay} style={[styles.iconContainer, { backgroundColor: colors.background }]}>
					<Ionicons name='camera' size={30} color={colors.primary} />
				</TouchableHighlight>
				<TouchableHighlight onPress={handlePickImage} underlayColor={colors.undetlay} style={[styles.iconContainer, { backgroundColor: colors.background }]}>
					<Entypo name='images' size={30} color={colors.primary} />
				</TouchableHighlight>
				<TouchableHighlight onPress={() => console.log('object')} underlayColor={colors.undetlay} style={[styles.iconContainer, { backgroundColor: colors.background }]}>
					<Feather name='file' size={30} color={colors.primary} />
				</TouchableHighlight>
				<TouchableHighlight onPress={() => console.log('object')} underlayColor={colors.undetlay} style={[styles.iconContainer, { backgroundColor: colors.background }]}>
					<Feather name='mic' size={30} color={colors.primary} />
				</TouchableHighlight>
			</View>
		</Animated.View>
	)
}

export function renderBubble(props: Readonly<BubbleProps<IMessage>>, { colors }: { colors: typeof darkTheme.colors }) {
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
					backgroundColor: colors.text === "#F1F6F9" ? "#a826ff" : "#fff",
					borderTopRightRadius: 15,
					borderTopLeftRadius: 15,
					marginVertical: 1,
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
					color: colors.text === "#F1F6F9" ? '#fff' : '#000',
				}
			}}
			usernameStyle={{
				color: colors.text === "#F1F6F9" ? '#fff' : '#000',
			}}
			tickStyle={{
				color: '#fff',
			}}

		/>
	);
};

export function renderTime(props: TimeProps<IMessage>, { colors }: { colors: typeof darkTheme.colors }) {
	return (
		<Time
			{...props}
			timeTextStyle={{
				left: {
					color: colors.text,
				},
				right: {
					color: '#fff',
				},
			}}
		/>)
}

export const RenderMessageImage = (props: MessageImageProps<IMessage & { preView: string, fileName: string | undefined, tumbnail: string }>, { setMessages }: { setMessages: React.Dispatch<React.SetStateAction<IMessage[]>> }) => {
	const Message = props.currentMessage;

	async function handlePress() {
		if (Message?.image?.startsWith('file') || !Message?.image || !Message.fileName) return;
		console.log(Message.image, 'first')
		await FileSystem.downloadAsync(Message?.image, fileDirectory + Message.fileName)
			.then(result => {
				console.log('Finished downloading to ', result);
			})
			.catch(error => {
				console.error(error, 'errrrrrrrr');
			});
		const newImage = fileDirectory + Message.fileName;
		setMessages((prevMessages: IMessage[]) => (prevMessages.map(e => {
			if (e._id === Message._id) {
				return { ...e, image: newImage };
			} else {
				return e;
			}
		})));
	};

	return (
		<View style={[props.containerStyle, { zIndex: 10, position: 'relative' }]}>
			{/* @ts-ignore */}
			<Lightbox
				activeProps={{
					style: styles.imageActive,
				}}
				{...props.lightboxProps}
				onOpen={handlePress}
			>
				<Image
					{...props.imageProps}
					style={[styles.image, props.imageStyle]}
					blurRadius={Message?.image?.startsWith('file') ? 0 : 8}
					source={{ uri: Message?.image?.startsWith('file') ? Message?.image : Message?.preView }}
				/>
			</Lightbox>
			{Message?.image?.startsWith('file') ? null :
				<TouchableHighlight onPress={handlePress} style={[styles.image, { position: 'absolute' }]}>
					<MaterialCommunityIcons style={{
						position: 'absolute',
						left: 55,
						top: 30,
						zIndex: 20
					}} name="download" size={34} color="#fff" />
				</TouchableHighlight>
			}
		</View>
	)
};

export function renderMessageVideo(props: MessageVideoProps<IMessage & { fileName: string | undefined, thumbnail: string }>, { setMessages, videoRef }: { setMessages: React.Dispatch<React.SetStateAction<IMessage[]>>, videoRef: React.MutableRefObject<Video> }) {
	const Message = props.currentMessage;

	async function handlePress() {
		if (Message?.video?.startsWith('file') || !Message?.video || !Message.fileName) return;
		console.log(Message.video, 'video')
		await FileSystem.downloadAsync(Message?.video, fileDirectory + Message.fileName)
			.then(result => {
				console.log('Finished downloading to ', result);
			})
			.catch(error => {
				console.error(error, 'errrrrrrrr');
			});
		const newVideo = fileDirectory + Message.fileName;
		setMessages((prevMessages: IMessage[]) => (prevMessages.map(e => {
			if (e._id === Message._id) {
				return { ...e, video: newVideo, thumbnail: Message?.thumbnail };
			} else {
				return e;
			}
		})));
		videoRef?.current?.presentFullscreenPlayer();
	};

	const CustomPosterComponent = ({ source, style }: { source: ImageSourcePropType, style: any }) => {
		return (
			<TouchableHighlight style={[{ zIndex: 10, position: 'relative' }, style]} onPress={handlePress}>
				<View style={[{ zIndex: 10, position: 'relative' }, style]}>
					<Image
						source={source}
						style={[{ zIndex: 10 }, style]}
						blurRadius={8}
						resizeMode={ResizeMode.COVER}
					/>
					<MaterialCommunityIcons style={{
						position: 'absolute',
						left: 55,
						top: 30,
						zIndex: 20
					}} name="download" size={34} color="#fff" />
				</View>
			</TouchableHighlight>
		);
	};

	return (<Pressable style={{ zIndex: 5 }} onPress={() => { videoRef.current.presentFullscreenPlayer(); videoRef.current.playAsync(); }}>
		<Video
			// @ts-ignore
			source={{ uri: Message?.video?.startsWith('file') ? Message?.video : undefined }}
			resizeMode={ResizeMode.COVER}
			useNativeControls={false}
			ref={videoRef}
			shouldPlay={false}
			style={{
				width: 150,
				height: 100,
				borderRadius: 13,
				margin: 3,
				zIndex: -10
			}}
			videoStyle={{
				zIndex: -10,
				backgroundColor: '#000'
			}}
			posterSource={{ uri: Message?.thumbnail ? Message?.thumbnail : undefined }}
			usePoster={Message?.video?.startsWith('file') ? false : true}
			PosterComponent={Message?.video?.startsWith('file') ? undefined : CustomPosterComponent}
		/>
	</Pressable>)
};
// if(e.isPlaying){videoRef?.current?.presentFullscreenPlayer()}
//
//
// console.log(e.isPlaying,'status');
// Message?.video?.startsWith('file') ? undefined : CustomPosterComponent

export function renderSend(props: SendProps<IMessage>, { colors }: { colors: typeof darkTheme.colors }) {
	return (<View style={{ flexDirection: 'row', alignItems: "center" }}>
		<Send {...props}>
			<Ionicons style={styles.sendIcon} name="send" size={27} color={colors.primary} />
		</Send>
	</View>)
};

export function renderActions(props: Readonly<ActionsProps>, { setOpen, open, colors }: { setOpen: React.Dispatch<React.SetStateAction<boolean>>, open: boolean, colors: typeof darkTheme.colors }) {
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

export function renderInputToolbar(props: InputToolbarProps<IMessage>, { colors }: { colors: typeof darkTheme.colors }) {
	return (
		<InputToolbar
			{...props}
			containerStyle={{
				backgroundColor: colors.card,
				borderTopColor: colors.card,
			}}
			renderComposer={(props) => <Composer textInputStyle={{ color: colors.text }} {...props} />}
		/>
	);
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
	},
	image: {
		width: 150,
		height: 100,
		borderRadius: 13,
		margin: 3,
		resizeMode: 'cover',
	},
	imageActive: {
		flex: 1,
		resizeMode: 'contain',
	},
});
