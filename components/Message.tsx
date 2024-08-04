import { ActivityIndicator, Image, ImageProps, Pressable, StyleSheet, Text, TouchableHighlight, View } from "react-native";
import Animated from "react-native-reanimated";
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { formatMillisecondsToTime, generateID, isMusicFile } from "../utils/utils";
import baseURL from "../utils/baseURL";
import * as FileSystem from 'expo-file-system';
import { Actions, ActionsProps, Bubble, BubbleProps, Composer, GiftedChat, IMessage, InputToolbar, InputToolbarProps, MessageAudioProps, MessageImage, MessageImageProps, MessageProps, MessageVideoProps, Send, SendProps, Time, TimeProps } from "react-native-gifted-chat";
import { ResizeMode, Video, Audio } from "expo-av";
import { darkTheme } from "../utils/theme";
import { currentPosition, IMessagePro, player, User } from "../utils/types";
import Ionicons from '@expo/vector-icons/Ionicons';
import Entypo from '@expo/vector-icons/Entypo';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { fileDirectory } from "../utils/directories";
import Lightbox from 'react-native-lightbox-v2';
import { startActivityAsync } from 'expo-intent-launcher';
import * as MediaLibrary from 'expo-media-library';


type RenderChatFooterProps = {
	user: User,
	socket: any,
	translateY: any,
	roomId: any,
	setMessages: React.Dispatch<React.SetStateAction<IMessage[]>>,
	recording: undefined | Audio.Recording,
	setRecording: React.Dispatch<React.SetStateAction<undefined | Audio.Recording>>,
	colors: typeof darkTheme.colors,
	setUploading: (callback: (prev: (string | number)[]) => (string | number)[]) => void,
	setErrors: (callback: (prev: (string | number)[]) => (string | number)[]) => void,
	handleAudioPermissions: () => Promise<boolean>,
}

export function RenderChatFooter({ user, socket, translateY, roomId, setMessages, recording, setRecording, colors, setErrors, setUploading, handleAudioPermissions }: RenderChatFooterProps) {
	async function sendMedia({ uri, type, name, mimType, duration }: { uri: string | null | undefined, type: "image" | "video" | "file" | "audio" | undefined, name?: string, mimType?: string, duration?: number }) {
		const id = generateID();

		if (type === 'image' && uri) {
			setUploading(e => [...e, id]);
			setMessages((prevMessages: IMessagePro[]) => GiftedChat.append(prevMessages, [{ _id: id, text: "", createdAt: new Date(), user, image: uri }]));
			const response = await FileSystem.uploadAsync(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file' });
			if (response.body === "ok") {
				socket?.emit('sendImage', { _id: id, text: "", createdAt: new Date(), user, roomId }, setUploading(e => e.filter(r => r !== id)));
			} else {
				setErrors(e => [...e, id]);
				console.log(response, 'error image upload');
			}
		} else if (type === 'video' && uri) {
			setUploading(e => [...e, id]);
			setMessages((prevMessages: IMessagePro[]) => GiftedChat.append(prevMessages, [{ _id: id, text: "", createdAt: new Date(), user, video: uri }]));
			const response = await FileSystem.uploadAsync(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file' })
			if (response.body === "ok") {
				socket?.emit('sendVideo', { _id: id, text: "", createdAt: new Date(), user, roomId }, setUploading(e => e.filter(r => r !== id)));
			} else {
				setErrors(e => [...e, id]);
				console.log(response, 'error video upload');
			}
		} else if (type === 'file' && uri) {
			// setUploading(e => [...e, id]);
			const isMusic = isMusicFile(name);
			if (isMusic) {
				const { status } = await Audio.Sound.createAsync({ uri });
				// @ts-ignore
				const totalSeconds = Math.floor(status?.durationMillis / 1000);
				console.log(status, 'status');
				// @ts-ignore
				setMessages((prevMessages: IMessagePro[]) => GiftedChat.append(prevMessages, [{ _id: id, text: "", createdAt: new Date(), user, audio: uri, fileName: name, duration: totalSeconds, playing: false }]));
			} else {
				setMessages((prevMessages: IMessagePro[]) => GiftedChat.append(prevMessages, [{ _id: id, text: "", createdAt: new Date(), user, file: uri, fileName: name, mimType }]));
				const response = await FileSystem.uploadAsync(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file' })
				if (response.body === "ok") {
					socket?.emit('sendFile', { _id: id, text: "", createdAt: new Date(), user, roomId, fileName: name }, setUploading(e => e.filter(r => r !== id)));
				} else {
					setErrors(e => [...e, id]);
					console.log(response, 'error file upload');
				}
			}
		} else if (type === 'audio' && uri) {
			// setUploading(e => [...e, id]);
			const totalSeconds = typeof duration === "number" ? Math.floor(duration / 1000) : undefined;
			setMessages((prevMessages: IMessagePro[]) => GiftedChat.append(prevMessages, [{ _id: id, text: "", createdAt: new Date(), user, audio: uri, fileName: name, duration: totalSeconds, playing: false }]));

		}
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

	const handlePickFile = async () => {
		try {
			const result = await DocumentPicker.getDocumentAsync({
				type: "*/*",
			});
			if (!result.canceled) {
				sendMedia({ uri: result.assets[0].uri, type: "file", name: result.assets[0].name, mimType: result.assets[0].mimeType });
			};
		} catch (error) {
			console.log(error);
		}
	};

	async function startRecording() {
		const per = await handleAudioPermissions();
		if (!per) return;
		const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);

		console.log('Recording started');
		setRecording(recording);
	};

	async function stopRecording() {
		console.log('Stopping recording..');
		setRecording(undefined);
		await recording?.stopAndUnloadAsync();
		const status = await recording?.getStatusAsync();
		const uri = recording?._uri;
		const extension = recording?._options?.android.extension;
		sendMedia({ uri, type: "audio", duration: status?.durationMillis });
		// console.log('Recording stopped and stored at', uri3);
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
				<TouchableHighlight onPress={handlePickFile} underlayColor={colors.undetlay} style={[styles.iconContainer, { backgroundColor: colors.background }]}>
					<Feather name='file' size={30} color={colors.primary} />
				</TouchableHighlight>
				<TouchableHighlight onPressIn={startRecording} onPressOut={stopRecording} underlayColor={colors.undetlay} style={[styles.iconContainer, { backgroundColor: colors.background }]}>
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
};

type renderMessageImageProps = { setMessages: React.Dispatch<React.SetStateAction<IMessage[]>>, downloading: (string | number)[], setDownloading: (callback: (prev: (string | number)[]) => (string | number)[]) => void, uploading: (string | number)[], errors: (string | number)[] };
type renderMessageVideoProps = { setMessages: React.Dispatch<React.SetStateAction<IMessage[]>>, downloading: (string | number)[], setDownloading: (callback: (prev: (string | number)[]) => (string | number)[]) => void, videoRef: React.MutableRefObject<Video>, uploading: (string | number)[], errors: (string | number)[] };
type renderMessageFileProps = { setMessages: React.Dispatch<React.SetStateAction<IMessage[]>>, downloading: (string | number)[], setDownloading: (callback: (prev: (string | number)[]) => (string | number)[]) => void, colors: typeof darkTheme.colors, uploading: (string | number)[], errors: (string | number)[], player: player, setPlayer: (callback: (prev: player) => (player)) => void };
type renderMessageAudioProps = { setMessages: React.Dispatch<React.SetStateAction<IMessage[]>>, downloading: (string | number)[], setDownloading: (callback: (prev: (string | number)[]) => (string | number)[]) => void, colors: typeof darkTheme.colors, uploading: (string | number)[], errors: (string | number)[], player: player, setPlayer: (callback: (prev: player) => (player)) => void, currentPosition: currentPosition, setCurrentPosition: (callback: (prev: currentPosition) => (currentPosition)) => void, setIsOpen: (e: boolean) => void };

export const renderMessageFile = (props: MessageProps<IMessagePro>, { setMessages, downloading, setDownloading, colors, uploading, setPlayer }: renderMessageFileProps) => {
	const Message = props.currentMessage;

	const isMusic = isMusicFile(Message?.fileName);


	const isPlaying = Message?.playing;
	const handleStop = () => {
		setPlayer((e) => {
			return { ...e, playing: false };
		});
	};

	const startPlaying = () => {
		setPlayer((e) => {
			return ({ ...e, playing: true })
		});
	};

	async function handlePlay() {
		handleStop();
		startPlaying();
	};

	//@ts-ignore
	const color = props.position === 'right' ? '#fff' : colors.text === "#F1F6F9" ? '#fff' : '#000'
	const time = formatMillisecondsToTime(Message?.duration)

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
				type: Message.mimType
			});
		} catch (error) {
			console.log(error)
		}
	};

	if (Message?.file) {
		// if (isMusic) {
		// 	return (
		// 		<View style={[{ zIndex: 10, position: 'relative', width: 200, height: 80, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
		// 			<View style={{ width: 50, height: 50, borderRadius: 50, marginHorizontal: 10, justifyContent: 'center', alignItems: 'center' }}>
		// 				{
		// 					!!uploading.find(e => e === Message?._id) ? <ActivityIndicator style={[styles.iconContainer, { backgroundColor: colors.background }]} size="large" color={colors.mirza} /> : Message?.file?.startsWith('file') ?
		// 						<TouchableHighlight onPress={isPlaying ? handleStop : handlePlay} style={[styles.iconContainer, { backgroundColor: colors.undetlay }]}>
		// 							<Ionicons name={isPlaying ? "pause" : "play"} size={24} color="#fff" style={{ marginRight: -2 }} />
		// 						</TouchableHighlight> :
		// 						!!downloading.find(e => e === Message?._id) ?
		// 							<ActivityIndicator style={[styles.iconContainer, { backgroundColor: colors.background }]} size="large" color={colors.mirza} /> :
		// 							<TouchableHighlight onPress={handlePlay} style={[styles.iconContainer, { backgroundColor: colors.background }]}>
		// 								<MaterialCommunityIcons name="download" size={34} color={colors.mirza} />
		// 							</TouchableHighlight>
		// 				}
		// 			</View>
		// 			<View style={{ margin: 12, justifyContent:"space-around" }}>
		// 				<Text style={[{ color: props.position === 'right' ? '#fff' : colors.text === "#F1F6F9" ? '#fff' : '#000', width: '60%' }]}>{Message?.fileName}</Text>
		// 				<Text style={{ color }}>{time}</Text>
		// 			</View>
		// 		</View>
		// 	)
		// } else {
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
				<Text style={[{ marginLeft: 'auto', marginRight: 10, color }]}>{Message?.fileName}</Text>
			</View>
		)
		// }
	}
};

export const RenderMessageImage = (props: MessageImageProps<IMessagePro>, { setMessages, downloading, setDownloading, uploading }: renderMessageImageProps) => {
	const Message = props.currentMessage;

	async function handlePress() {
		if (Message?.image?.startsWith('file') || !Message?.image || !Message.fileName) return;
		// console.log(Message.image, 'first')
		setDownloading(e => [...e, Message._id]);
		await FileSystem.downloadAsync(Message?.image, fileDirectory + Message.fileName)
			.then(result => {
				console.log('Finished downloading to ', result);
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
				console.log('Finished downloading to ', result);
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

export const renderMessageAudio = (props: MessageAudioProps<IMessagePro>, { setMessages, downloading, setDownloading, uploading, colors, errors, setPlayer, player, currentPosition, setCurrentPosition, setIsOpen }: renderMessageAudioProps) => {
	const Message = props.currentMessage;
	const isPlaying = player?.playing === true && Message?._id === player.id;
	// let aaa = [];

	const stopPlaying = async ({ isForStart }: { isForStart: boolean }) => {
		if (!player?.track) return;
		const status = await player.track.getStatusAsync();
		await player.track.stopAsync();
		await player.track.unloadAsync();
		// @ts-ignore 
		const lastPosition = Message?._id === player.id ? status.positionMillis : 0;

		// aaa.push(Message?._id === player.id);

		setPlayer((e) => {
			//@ts-ignore
			return { uri: undefined, track: undefined, name: undefined, id: Message?._id, duration: status.durationMillis, lastPosition, playing: isForStart ? true : false };
		});
		setCurrentPosition(() => ({ id: Message?._id, position: lastPosition }));
	};

	const startPlaying = async () => {
		if (!Message?.audio) return;

		// if(Message?._id !== player?.id){
		// 	setCurrentPosition(0);
		// };

		setPlayer((e) => {
			return { ...e, uri: Message?.audio, id: Message?._id };
		});

		setIsOpen(true);

		// setLastTrack((e) => {
		// 	return { ...e, uri: Message?.audio, id: player?.id };
		// });

		// console.log(Message?._id === last	Track?.id,'Message?._id === lastTrack?.id')


		await stopPlaying({ isForStart: true });

		const { sound: newSound, status } = await Audio.Sound.createAsync(
			{ uri: Message.audio },
			{ isLooping: false, progressUpdateIntervalMillis: 1000, shouldPlay: false }
		);

		if (currentPosition.id === Message?._id && currentPosition.position) {
			await newSound.playFromPositionAsync(currentPosition.position);
		} else {
			await newSound.playAsync();
			setCurrentPosition(() => ({ id: Message?._id, position: undefined }));
		};

		setPlayer(() => {
			//@ts-ignore
			return { track: newSound, name: Message.fileName, uri: Message.audio, uuid: Message._id, duration: status?.durationMillis, id: Message._id, playing: true }
		});
	};

	async function handlePress() {
		console.log('download')
	};

	//@ts-ignore
	const color = props.position === 'right' ? '#fff' : colors.text === "#F1F6F9" ? '#fff' : '#000';
	const time = formatMillisecondsToTime(Message?.duration);

	//@ts-ignore
	const currentPositionTime = (currentPosition.position > 1) && (Message?._id === currentPosition?.id) ? `${formatMillisecondsToTime(Math.floor((currentPosition.position / 1000)))} / ${time}` : time;

	return (
		<View style={[{ zIndex: 10, position: 'relative', width: 200, height: 80, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
			<View style={{ width: 50, height: 50, borderRadius: 50, marginHorizontal: 10, justifyContent: 'center', alignItems: 'center' }}>
				{
					!!uploading.find(e => e === Message?._id) ? <ActivityIndicator style={[styles.iconContainer, { backgroundColor: colors.background }]} size="large" color={colors.mirza} /> : Message?.audio?.startsWith('file') ?
						<TouchableHighlight onPress={isPlaying ? () => stopPlaying({ isForStart: false }) : startPlaying} style={[styles.iconContainer, { backgroundColor: colors.undetlay }]}>
							<Ionicons name={isPlaying ? "pause" : "play"} size={30} color="#fff" style={{ marginRight: isPlaying ? 0 : -4 }} />
						</TouchableHighlight> :
						!!downloading.find(e => e === Message?._id) ?
							<ActivityIndicator style={[styles.iconContainer, { backgroundColor: colors.background }]} size="large" color={colors.mirza} /> :
							<TouchableHighlight onPress={handlePress} style={[styles.iconContainer, { backgroundColor: colors.background }]}>
								<MaterialCommunityIcons name="download" size={34} color={colors.mirza} />
							</TouchableHighlight>
				}
			</View>
			<View style={{ margin: 12 }}>
				<Text style={[{ color: color, width: '60%' }]}>{Message?.fileName}</Text>
				<Text style={{ color }}>{currentPositionTime}</Text>
			</View>
		</View>
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
