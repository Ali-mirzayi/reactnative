import { ActivityIndicator, Image, ImageProps, Pressable, StyleSheet, Text, TouchableHighlight, View, Animated as NativeAnimated, PanResponder, PanResponderInstance, TouchableOpacity, Alert } from "react-native";
import Animated from "react-native-reanimated";
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { formatMillisecondsToTime } from "../utils/utils";
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { Actions, ActionsProps, Bubble, BubbleProps, Composer, GiftedChat, IMessage, InputToolbar, InputToolbarProps, MessageAudioProps, MessageImage, MessageImageProps, MessageProps, MessageVideoProps, Send, SendProps, Time, TimeProps } from "react-native-gifted-chat";
import { ResizeMode, Video, Audio } from "expo-av";
import { darkTheme } from "../utils/theme";
import { availableStatus, currentPosition, IMessagePro, player, playerStatus, RecordingEnum, User } from "../utils/types";
import Ionicons from '@expo/vector-icons/Ionicons';
import Entypo from '@expo/vector-icons/Entypo';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { fileDirectory } from "../utils/directories";
import Lightbox from 'react-native-lightbox-v2';
import { startActivityAsync } from 'expo-intent-launcher';
import { save, sendMedia, startRecording } from "./SendMedia";
import MovingText from "./MovingText";
import { audioListType } from "../hooks/useAudioList";

type RenderChatFooterProps = {
	user: User,
	socket: any,
	translateY: any,
	roomId: any,
	setMessages: (callback: (prev: IMessagePro[] | []) => (IMessagePro[] | [])) => void,
	// setMessages: React.Dispatch<React.SetStateAction<IMessage[]>>,
	recording: undefined | { playing: boolean, status: RecordingEnum },
	setRecording: React.Dispatch<React.SetStateAction<{
		playing: boolean;
		status: RecordingEnum;
	} | undefined>>,
	colors: typeof darkTheme.colors,
	setUploading: (callback: (prev: (string | number)[]) => (string | number)[]) => void,
	setErrors: (callback: (prev: (string | number)[]) => (string | number)[]) => void,
	handleAudioPermissions: () => Promise<boolean>,
	//@ts-ignore
	pan: Animated.Value,
	panResponder: PanResponderInstance,
	permissionResponse: Audio.PermissionResponse | null
}

export function RenderChatFooter({ user, socket, translateY, roomId, setMessages, recording, setRecording, colors, setErrors, setUploading, handleAudioPermissions, pan, panResponder, permissionResponse }: RenderChatFooterProps) {
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
			sendMedia({ uri: result.assets[0].uri, type: result.assets[0].type, setErrors, setMessages, setUploading, roomId, socket, user, mimeType: result.assets[0].mimeType });

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
			sendMedia({ uri: result.assets[0].uri, type: result.assets[0].type, setErrors, setMessages, setUploading, roomId, socket, user, mimeType: result.assets[0].mimeType });
		}
	};

	const handlePickFile = async () => {
		try {
			const result = await DocumentPicker.getDocumentAsync({
				type: "*/*",
			});
			if (!result.canceled) {
				sendMedia({ uri: result.assets[0].uri, type: "file", name: result.assets[0].name, mimeType: result.assets[0].mimeType, setErrors, setMessages, setUploading, roomId, socket, user });
			};
		} catch (error) {
			console.log(error);
		}
	};

	return (
		<Animated.View style={{ transform: [{ translateY }] }}>
			<View style={[styles.footerChatOpen, { backgroundColor: colors.card }]}>
				<TouchableHighlight onPress={handleCamera} underlayColor={colors.undetlay} style={[styles.iconContainer, { backgroundColor: colors.container }]}>
					<Ionicons name='camera' size={30} color={colors.primary} />
				</TouchableHighlight>
				<TouchableHighlight onPress={handlePickImage} underlayColor={colors.undetlay} style={[styles.iconContainer, { backgroundColor: colors.container }]}>
					<Entypo name='images' size={30} color={colors.primary} />
				</TouchableHighlight>
				<TouchableHighlight onPress={handlePickFile} underlayColor={colors.undetlay} style={[styles.iconContainer, { backgroundColor: colors.container }]}>
					<Feather name='file' size={30} color={colors.primary} />
				</TouchableHighlight>
				<NativeAnimated.View {...panResponder.panHandlers} style={{ transform: [{ translateY: pan }] }}>
					<TouchableHighlight
						onPressIn={() => startRecording({ handleAudioPermissions, setRecording, permissionResponse })}
						style={[styles.iconContainer, { backgroundColor: colors.container }]}
						underlayColor={colors.undetlay}
					>
						<Feather name='mic' size={30} color={colors.primary} />
					</TouchableHighlight>
				</NativeAnimated.View>
				{
					recording?.playing ? (
						<TouchableHighlight onPress={() => setRecording((e) => ({ ...e, playing: false, status: RecordingEnum.cancel }))} style={[styles.trashIconContainer, { backgroundColor: colors.red, opacity: 0.85 }]}>
							<Feather name='trash' size={30} color={colors.container} />
						</TouchableHighlight>
					) : null
				}
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
};

type renderMessageImageProps = { setMessages: (callback: (prev: IMessagePro[] | []) => (IMessagePro[] | [])) => void, downloading: (string | number)[], setDownloading: (callback: (prev: (string | number)[]) => (string | number)[]) => void, uploading: (string | number)[], errors: (string | number)[] };
// type renderMessageImageProps = { setMessages: React.Dispatch<React.SetStateAction<IMessage[]>>, downloading: (string | number)[], setDownloading: (callback: (prev: (string | number)[]) => (string | number)[]) => void, uploading: (string | number)[], errors: (string | number)[] };
type renderMessageVideoProps = { setMessages: (callback: (prev: IMessagePro[] | []) => (IMessagePro[] | [])) => void, downloading: (string | number)[], setDownloading: (callback: (prev: (string | number)[]) => (string | number)[]) => void, videoRef: React.MutableRefObject<Video>, uploading: (string | number)[], errors: (string | number)[] };
// type renderMessageVideoProps = { setMessages: React.Dispatch<React.SetStateAction<IMessage[]>>, downloading: (string | number)[], setDownloading: (callback: (prev: (string | number)[]) => (string | number)[]) => void, videoRef: React.MutableRefObject<Video>, uploading: (string | number)[], errors: (string | number)[] };
type renderMessageFileProps = { setMessages: (callback: (prev: IMessagePro[] | []) => (IMessagePro[] | [])) => void, downloading: (string | number)[], setDownloading: (callback: (prev: (string | number)[]) => (string | number)[]) => void, colors: typeof darkTheme.colors, uploading: (string | number)[], errors: (string | number)[], player: player, setPlayer: (callback: (prev: player) => (player)) => void };
// type renderMessageFileProps = { setMessages: React.Dispatch<React.SetStateAction<IMessage[]>>, downloading: (string | number)[], setDownloading: (callback: (prev: (string | number)[]) => (string | number)[]) => void, colors: typeof darkTheme.colors, uploading: (string | number)[], errors: (string | number)[], player: player, setPlayer: (callback: (prev: player) => (player)) => void };
type renderMessageAudioProps = {
	setMessages: (callback: (prev: IMessagePro[] | []) => (IMessagePro[] | [])) => void, downloading: (string | number)[], setDownloading: (callback: (prev: (string | number)[]) => (string | number)[]) => void, colors: typeof darkTheme.colors, uploading: (string | number)[], errors: (string | number)[], player: player, setPlayer: (callback: (prev: player) => (player)) => void, currentPosition: currentPosition, setCurrentPosition: (callback: (prev: currentPosition) => (currentPosition)) => void, setIsOpen: (e: boolean) => void,
	// setMessages: React.Dispatch<React.SetStateAction<IMessagePro[]>>, downloading: (string | number)[], setDownloading: (callback: (prev: (string | number)[]) => (string | number)[]) => void, colors: typeof darkTheme.colors, uploading: (string | number)[], errors: (string | number)[], player: player, setPlayer: (callback: (prev: player) => (player)) => void, currentPosition: currentPosition, setCurrentPosition: (callback: (prev: currentPosition) => (currentPosition)) => void, setIsOpen: (e: boolean) => void,
	startPlayingByItem: ({ item, isMessage }: {
		item: audioListType;
		isMessage?: boolean;
	}) => Promise<void>, stopPlaying: ({ isForStart, isEnded }: {
		isForStart: boolean;
		isEnded: boolean;
	}) => Promise<void>,
	playerStatus: playerStatus
};

export const renderMessageFile = (props: MessageProps<IMessagePro>, { setMessages, downloading, setDownloading, colors, uploading, setPlayer }: renderMessageFileProps) => {
	const Message = props.currentMessage;
	//@ts-ignore
	const color = props.position === 'right' ? '#fff' : colors.text === "#F1F6F9" ? '#fff' : '#000'

	async function handlePress() {
		if (Message?.file?.startsWith('file') || !Message?.file || !Message.fileName) return;
		setDownloading(e => [...e, Message._id]);
		await FileSystem.downloadAsync(Message?.file, fileDirectory + Message.fileName)
			.then(result => {
				console.log('Finished downloading to ', result);
			})
			.catch(error => {
				console.error(error, 'errrrrrrrr');
			}).finally(() => {
				setDownloading(e => e.filter(r => r !== Message._id));
			});
		const newFile = fileDirectory + Message.fileName;
		setMessages((prevMessages: IMessagePro[]) => (prevMessages.map(e => {
			if (e._id === Message._id) {
				return { ...e, file: newFile };
			} else {
				return e;
			}
		})));
	};

	const openFile = async () => {
		console.log(Message?.fileName, 'Message?.file')
		if (!Message?.file?.startsWith('file') || !Message?.file || !Message.fileName) return;
		const contentURL = await FileSystem.getContentUriAsync(Message.file);

		try {
			await startActivityAsync('android.intent.action.VIEW', {
				data: contentURL,
				flags: 1,
				type: Message.mimeType
			});
		} catch (error) {
			console.log(error)
		}
	};

	if (Message?.file) {
		return (
			<View style={[{ zIndex: 10, position: 'relative', width: 200, height: 80, flexDirection: 'row', alignItems: 'center' }]}>
				<View style={{ width: 50, height: 50, borderRadius: 50, marginHorizontal: 10, justifyContent: 'center', alignItems: 'center' }}>
					{
						!!uploading.find(e => e === Message?._id) ? <ActivityIndicator style={[styles.iconContainer, { backgroundColor: colors.background }]} size="large" color={colors.mirza} /> : Message?.file?.startsWith('file') ?
							<TouchableHighlight onPress={openFile} style={[styles.iconContainer, { backgroundColor: colors.background }]}>
								<Feather name="file" size={28} color={colors.mirza} />
							</TouchableHighlight> :
							!!downloading.find(e => e === Message?._id) ?
								<ActivityIndicator style={[styles.iconContainer, { backgroundColor: colors.background }]} size="large" color={colors.mirza} /> :
								<TouchableHighlight onPress={handlePress} style={[styles.iconContainer, { backgroundColor: colors.background }]}>
									<MaterialCommunityIcons name="download" size={34} color={colors.mirza} />
								</TouchableHighlight>
					}
				</View>
				<View style={{ marginLeft: 0, marginRight: 'auto', width: 130, overflow: 'hidden' }}>
					<MovingText disable={false} animationThreshold={15} style={[{ color: color, size: 10 }]}>{Message?.fileName ? Message?.fileName : 'Voice'}</MovingText>
				</View>
			</View>
		)
		// }
	}
};

export const RenderMessageImage = (props: MessageImageProps<IMessagePro>, { setMessages, downloading, setDownloading, uploading }: renderMessageImageProps) => {
	const Message = props.currentMessage;

	async function handlePress() {
		if (Message?.image?.startsWith('file') || !Message?.image || !Message.fileName) return;
		setDownloading(e => [...e, Message._id]);
		await FileSystem.downloadAsync(Message?.image, fileDirectory + Message.fileName)
			.then(result => {
				console.log('Finished downloading to ', 'result');
			})
			.catch(error => {
				console.error(error, 'errrrrrrrr');
			}).finally(() => {
				setDownloading(e => e.filter(r => r !== Message._id));
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

	const save = async () => {
		// console.log(Message?.mimeType,'first');
		if (!Message || !Message.image || !Message.mimeType) return;
		// const result = await DocumentPicker.getDocumentAsync({  
		// 	type: '*/*',  
		// 	copyToCacheDirectory: false,  
		// });  

		// if (result. === 'success') {  
		// 	const myDir = result.uri; // Get the selected directory URI  

		// 	try {  
		// 		// Create the new directory  
		// 		await FileSystem.makeDirectoryAsync(`${myDir}/Mirzagram`, { intermediates: true });  
		// 		console.log('Directory created successfully',`${myDir}/Mirzagram`);  
		// 	} catch (error) {  
		// 		console.error('Error creating directory:', error);  
		// 	}  
		// } else {  
		// 	console.log('User cancelled the document picker');  
		// }  
		const { granted } = await MediaLibrary.requestPermissionsAsync();
		if (granted) {
			try {

				const asset = await MediaLibrary.createAssetAsync(Message.image);
				MediaLibrary.createAlbumAsync('Mirzagram', asset, false)
					.then(() => {
						console.log('File Saved Successfully!');
					})
					.catch(() => {
						console.log('Error In Saving File!');
					});
			} catch (error) {
				console.log(error);
			}
		} else {
			console.log('Need Storage permission to save file');
		}
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
			{
				!!uploading.find(e => e === Message?._id) ? <ActivityIndicator style={styles.download} size="large" color="#fff" /> : Message?.image?.startsWith('file') ? null :
					!!downloading.find(e => e === Message?._id) || !!uploading.find(e => e === Message?._id) ?
						<ActivityIndicator style={styles.download} size="large" color="#fff" /> :
						<TouchableHighlight onPress={handlePress} style={[styles.image, { position: 'absolute' }]}>
							<MaterialCommunityIcons style={styles.download} name="download" size={34} color="#fff" />
						</TouchableHighlight>
			}
			<Pressable onPress={save}>
				<Text>save</Text>
			</Pressable>
		</View>
	)
};

export function renderMessageVideo(props: MessageVideoProps<IMessagePro>, { setMessages, videoRef, downloading, setDownloading, uploading, errors }: renderMessageVideoProps) {
	const Message = props.currentMessage;

	async function handlePress() {
		if (Message?.video?.startsWith('file') || !Message?.video || !Message.fileName) return;
		setDownloading(e => [...e, Message._id]);
		await FileSystem.downloadAsync(Message?.video, fileDirectory + Message.fileName)
			.then(result => {
				console.log('Finished downloading to ', 'result');
			})
			.catch(error => {
				console.error(error, 'errrrrrrrr');
			}).finally(() => {
				setDownloading(e => e.filter(r => r !== Message._id));
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
		videoRef.current.playAsync();
	};

	const CustomPosterComponent = ({ source, style }: { source: ImageProps["source"], style: ImageProps["style"] }) => {
		return (
			<TouchableHighlight style={[{ zIndex: 10, position: 'relative' }, style]} onPress={handlePress}>
				<View style={[{ zIndex: 10, position: 'relative' }, style]}>
					<Image
						source={source}
						style={[{ zIndex: 10 }, style]}
						blurRadius={8}
						resizeMode={ResizeMode.COVER}
					/>
					{
						!!downloading.find(e => e === Message?._id) ?
							<ActivityIndicator style={styles.download} size="large" color="#fff" /> :
							<MaterialCommunityIcons style={styles.download} name="download" size={34} color="#fff" />
					}
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
		{
			!!uploading.find(e => e === Message?._id) && <ActivityIndicator style={styles.download} size="large" color="#fff" />
		}
	</Pressable>)
};

// export const renderMessageAudio = (props: MessageAudioProps<IMessagePro>) => {
// 	const Message = props.currentMessage;
// 	console.log(Message?.fileName);

// 	return (
// 		<View />
// 	)
// };

export const renderMessageAudio = (props: MessageAudioProps<IMessagePro>, { setMessages, downloading, setDownloading, uploading, colors, errors, setPlayer, player, currentPosition, setCurrentPosition, setIsOpen, startPlayingByItem, stopPlaying, playerStatus }: renderMessageAudioProps) => {
	const Message = props.currentMessage;
	// const isPlaying = playerStatus.isPlaying&&playerStatus.id===Message._id;
	const isPlaying = Message.playing;
	const Modes = Message.availableStatus;

	async function handlePress() {
		if (Message?.file?.startsWith('file') || !Message?.audio || !Message.fileName) return;
		// setDownloading(e => [...e, Message._id]);
		setMessages(e => e.map(message => {
			if (message._id === Message._id) {
				return { ...message, availableStatus: availableStatus.downloading }
			} else {
				return message
			}
		}));
		await FileSystem.downloadAsync(Message?.audio, fileDirectory + Message.fileName)
			.then(() => {
				console.log('Finished downloading to ', 'result');
				setMessages(e => e.map(message => {
					if (message._id === Message._id) {
						return { ...message, availableStatus: availableStatus.available }
					} else {
						return message
					}
				}));
			})
			.catch(error => {
				console.error(error, 'errrrrrrrr');
			}).finally(() => {
				// setDownloading(e => e.filter(r => r !== Message._id));
			});
		const newFile = fileDirectory + Message.fileName;
		//delete this it at last
		if (!Message.duration) {
			const { sound, status } = await Audio.Sound.createAsync({ uri: newFile }, { shouldPlay: false });
			//@ts-ignore
			const duration: number = status?.durationMillis;
			setMessages((prevMessages: IMessagePro[]) => (prevMessages.map(e => {
				if (e._id === Message._id) {
					return { ...e, audio: newFile, duration };
				} else {
					return e;
				}
			})));
			await sound.unloadAsync();
		} else {
			setMessages((prevMessages: IMessagePro[]) => (prevMessages.map(e => {
				if (e._id === Message._id) {
					return { ...e, audio: newFile };
				} else {
					return e;
				}
			})));
		}
	};

	//@ts-ignore
	const color = props.position === 'right' ? '#fff' : colors.text === "#F1F6F9" ? '#fff' : '#000';
	const time = formatMillisecondsToTime(Message?.duration);

	let finalMode = undefined;

	const TransferMode = (<ActivityIndicator style={[styles.iconContainer, { backgroundColor: colors.undetlay }]} size="large" color="#fff" />);

	const AvailableMode = (<TouchableHighlight onPress={isPlaying ? () => stopPlaying({ isForStart: false, isEnded: false }) : () => startPlayingByItem({ item: { audioName: Message.fileName ?? "", id: Message._id, uri: Message.audio ?? '' }, isMessage: true })} style={[styles.iconContainer, { backgroundColor: colors.undetlay }]}>
		<Ionicons name={isPlaying ? "pause" : "play"} size={30} color="#fff" style={{ marginRight: isPlaying ? 0 : -4 }} />
	</TouchableHighlight>);

	const DownloadMode = (<TouchableHighlight onPress={handlePress} style={[styles.iconContainer, { backgroundColor: colors.undetlay }]}>
		<MaterialCommunityIcons name="download" size={34} color="#fff" />
	</TouchableHighlight>);

	switch (Modes) {
		case availableStatus.available:
			finalMode = AvailableMode;
			break;
		case availableStatus.download:
			finalMode = DownloadMode;
			break;
		case availableStatus.downloading:
			finalMode = TransferMode;
			break;
		case availableStatus.uploading:
			finalMode = TransferMode;
			break;
		default:
			finalMode = AvailableMode;
			break;
	};

	console.log(Modes === availableStatus.available,'asd');

	return (
		<>
			<View style={[{ zIndex: 10, position: 'relative', width: 200, height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden', paddingTop: 10 }]}>
				<View style={{ width: 50, height: 50, borderRadius: 50, marginHorizontal: 10, justifyContent: 'center', alignItems: 'center' }}>
					{/* {
						!!uploading.find(e => e === Message?._id) ? <ActivityIndicator style={[styles.iconContainer, { backgroundColor: colors.background }]} size="large" color={colors.mirza} /> : Message?.audio?.startsWith('file') ?
							<TouchableHighlight onPress={isPlaying ? () => stopPlaying({ isForStart: false, isEnded: false }) : () => startPlayingByItem({ item: { audioName: Message.fileName ?? "", id: Message._id, uri: Message.audio ?? '' }, isMessage: true })} style={[styles.iconContainer, { backgroundColor: colors.undetlay }]}>
								<Ionicons name={isPlaying ? "pause" : "play"} size={30} color="#fff" style={{ marginRight: isPlaying ? 0 : -4 }} />
							</TouchableHighlight> :
							!!downloading.find(e => e === Message?._id) ?
								<ActivityIndicator style={[styles.iconContainer, { backgroundColor: colors.background }]} size="large" color={colors.mirza} /> :
								<TouchableHighlight onPress={handlePress} style={[styles.iconContainer, { backgroundColor: colors.background }]}>
									<MaterialCommunityIcons name="download" size={34} color={colors.mirza} />
								</TouchableHighlight>
					} */}
					{finalMode}
				</View>
				<View style={{ marginLeft: 0, marginRight: 'auto', width: 130, overflow: 'hidden' }}>
					<MovingText disable={isPlaying ? false : true} animationThreshold={15} style={[{ color: color, size: 10 }]}>{Message?.fileName ? Message?.fileName : 'Voice'}</MovingText>
				</View>
			</View>
			<View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'flex-end', gap: 10, paddingRight: 10, marginBottom: 5 }}>
				<Text style={{ color, fontWeight: '500', fontSize: 14 }}>{time}</Text>
				{Modes === availableStatus.available ? <Pressable onPress={() => save({ uri: Message ? Message?.audio : undefined })}>
					<Text style={{ color, fontWeight: '600', fontSize: 16 }}>Save</Text>
				</Pressable> : null}
			</View>
		</>
	)
};

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
	trashIconContainer: {
		position: 'absolute',
		top: '-12%',
		left: '84%',
		transform: [{ translateY: -15 }],
		borderRadius: 50,
		padding: 10
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
	download: {
		position: 'absolute',
		left: 55,
		top: 30,
		zIndex: 50
	}
});
