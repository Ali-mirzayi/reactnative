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
import { availableStatus, currentPosition, IMessagePro, player, RecordingEnum, User, videoDuration } from "../utils/types";
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
	recording: undefined | { playing: boolean, status: RecordingEnum },
	setRecording: React.Dispatch<React.SetStateAction<{
		playing: boolean;
		status: RecordingEnum;
	} | undefined>>,
	colors: typeof darkTheme.colors,
	handleAudioPermissions: () => Promise<boolean>,
	//@ts-ignore
	pan: Animated.Value,
	panResponder: PanResponderInstance,
	permissionResponse: Audio.PermissionResponse | null,
	videosDuration: [] | videoDuration[]
}

export function RenderChatFooter({ user, socket, translateY, roomId, setMessages, recording, setRecording, colors, handleAudioPermissions, pan, panResponder, permissionResponse, videosDuration }: RenderChatFooterProps) {
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
			sendMedia({ uri: result.assets[0].uri, type: result.assets[0].type, setMessages, roomId, socket, user, mimeType: result.assets[0].mimeType });

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
			sendMedia({ uri: result.assets[0].uri, type: result.assets[0].type, setMessages, roomId, socket, user, mimeType: result.assets[0].mimeType, videosDuration });
		}
	};

	const handlePickFile = async () => {
		try {
			const result = await DocumentPicker.getDocumentAsync({
				type: "*/*",
			});
			if (!result.canceled) {
				sendMedia({ uri: result.assets[0].uri, type: "file", name: result.assets[0].name, mimeType: result.assets[0].mimeType, setMessages, roomId, socket, user });
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

type renderMessageImageProps = { setMessages: (callback: (prev: IMessagePro[] | []) => (IMessagePro[] | [])) => void, colors: typeof darkTheme.colors };
type renderMessageVideoProps = { setMessages: (callback: (prev: IMessagePro[] | []) => (IMessagePro[] | [])) => void, colors: typeof darkTheme.colors, videoRef: React.MutableRefObject<Video>, videosDuration: [] | videoDuration[], setVideosDuration: (callback: (prev: (videoDuration)[]) => (videoDuration)[]) => void };
type renderMessageFileProps = { setMessages: (callback: (prev: IMessagePro[] | []) => (IMessagePro[] | [])) => void, colors: typeof darkTheme.colors };
type renderMessageAudioProps = {
	setMessages: (callback: (prev: IMessagePro[] | []) => (IMessagePro[] | [])) => void, colors: typeof darkTheme.colors, setIsOpen: (e: boolean) => void,
	startPlayingByItem: ({ item, isMessage }: {
		item: audioListType;
		isMessage?: boolean;
	}) => Promise<void>, stopPlaying: ({ isForStart, isEnded }: {
		isForStart: boolean;
		isEnded: boolean;
	}) => Promise<void>,
};

export const renderMessageFile = (props: MessageProps<IMessagePro>, { setMessages, colors }: renderMessageFileProps) => {
	const Message = props.currentMessage;
	//@ts-ignore
	const color = props.position === 'right' ? '#fff' : colors.text === "#F1F6F9" ? '#fff' : '#000';
	const messageStatus = Message.availableStatus;


	async function handlePress() {
		if (Message?.file?.startsWith('file') || !Message?.file || !Message.fileName) return;
		setMessages(e => e.map(message => {
			if (message._id === Message._id) {
				return { ...message, availableStatus: availableStatus.downloading }
			} else {
				return message
			}
		}));
		await FileSystem.downloadAsync(Message?.file, fileDirectory + Message.fileName)
			.then(result => {
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
			})
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
		if (!Message?.file?.startsWith('file') || !Message?.file) return;
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

	let finalMode = undefined;

	const TransferMode = (<ActivityIndicator style={[styles.iconContainer, { backgroundColor: colors.undetlay }]} size="large" color="#fff" />);

	const AvailableMode = (<TouchableHighlight onPress={openFile} style={[styles.iconContainer, { backgroundColor: colors.undetlay }]}>
		<Feather name="file" size={28} color={colors.mirza} />
	</TouchableHighlight>);

	const DownloadMode = (<TouchableHighlight onPress={handlePress} style={[styles.iconContainer, { backgroundColor: colors.undetlay }]}>
		<MaterialCommunityIcons name="download" size={34} color="#fff" />
	</TouchableHighlight>);

	switch (messageStatus) {
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


	if (Message?.file) {
		return (
			<>
				<View style={[{ zIndex: 10, position: 'relative', width: 200, height: 60, flexDirection: 'row', alignItems: 'center', paddingTop: 10 }]}>
					<View style={{ marginHorizontal: 10 }}>
						{finalMode}
					</View>
					<View style={{ marginLeft: 0, marginRight: 'auto', width: 130, overflow: 'hidden' }}>
						<MovingText disable={false} animationThreshold={15} style={[{ color: color, size: 10 }]}>{Message?.fileName ? Message?.fileName : 'Voice'}</MovingText>
					</View>
				</View>
				{messageStatus === availableStatus.available ? <Pressable style={{ marginLeft: "auto", paddingRight: 10, paddingBottom: 5 }} onPress={() => save({ uri: Message ? Message?.file : undefined })}>
					<Text style={{ color: colors.text, fontWeight: '600', fontSize: 16 }}>Save</Text>
				</Pressable> : null}
			</>
		)
	}
};

export const RenderMessageImage = (props: MessageImageProps<IMessagePro>, { setMessages, colors }: renderMessageImageProps) => {
	const Message = props.currentMessage;
	const messageStatus = Message.availableStatus;

	async function handlePress() {
		if (Message?.image?.startsWith('file') || !Message?.image || !Message.fileName) return;
		setMessages(e => e.map(message => {
			if (message._id === Message._id) {
				return { ...message, availableStatus: availableStatus.downloading }
			} else {
				return message
			}
		}));
		await FileSystem.downloadAsync(Message?.image, fileDirectory + Message.fileName)
			.then(result => {
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
			})
		const newImage = fileDirectory + Message.fileName;
		setMessages((prevMessages: IMessage[]) => (prevMessages.map(e => {
			if (e._id === Message._id) {
				return { ...e, image: newImage };
			} else {
				return e;
			}
		})));
	};

	let finalMode = undefined;

	const TransferMode = (<ActivityIndicator style={[styles.iconContainer, styles.download, { backgroundColor: colors.undetlay }]} size="large" color="#fff" />);

	const DownloadMode = (<TouchableOpacity onPress={handlePress} style={[styles.iconContainer, styles.download, { backgroundColor: colors.undetlay }]}>
		<MaterialCommunityIcons name="download" size={34} color="#fff" />
	</TouchableOpacity>);

	switch (messageStatus) {
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
			break;
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
			{finalMode}
			{messageStatus === availableStatus.available ? <Pressable style={{ marginRight: 4, padding: 5 }} onPress={() => save({ uri: Message ? Message?.image : undefined })}>
				<Text style={{ color: colors.text, fontWeight: '600', fontSize: 16 }}>Save</Text>
			</Pressable> : null}
		</View>
	)
};

export function renderMessageVideo(props: MessageVideoProps<IMessagePro>, { setMessages, videoRef, colors }: renderMessageVideoProps) {
	const Message = props.currentMessage;
	const messageStatus = Message.availableStatus;

	const duration = Message.duration;
	// const vidDuration = videosDuration.find(v => v.id === Message._id);
	// const 

	async function handlePress() {
		if (Message?.video?.startsWith('file') || !Message?.video || !Message.fileName) return;
		setMessages(e => e.map(message => {
			if (message._id === Message._id) {
				return { ...message, availableStatus: availableStatus.downloading }
			} else {
				return message
			}
		}));
		await FileSystem.downloadAsync(Message?.video, fileDirectory + Message.fileName)
			.then(() => {
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
			})
		const newVideo = fileDirectory + Message.fileName;
		setMessages((prevMessages: IMessage[]) => (prevMessages.map(e => {
			if (e._id === Message._id) {
				return { ...e, video: newVideo };
			} else {
				return e;
			}
		})));
		videoRef?.current?.presentFullscreenPlayer();
		videoRef.current.playAsync();
	};

	const onPlayVideo = () => {
		videoRef.current.presentFullscreenPlayer();
		videoRef.current.playAsync();
	}

	const TransferMode = (<ActivityIndicator style={[styles.iconContainer, styles.download, { backgroundColor: colors.undetlay }]} size="large" color="#fff" />);

	const DownloadMode = (<TouchableHighlight onPress={handlePress} style={[styles.iconContainer, styles.download, { backgroundColor: colors.undetlay }]}>
		<MaterialCommunityIcons name="download" size={34} color="#fff" />
	</TouchableHighlight>);

	const AvailableMode = (<TouchableHighlight onPress={onPlayVideo} style={[styles.iconContainer, styles.download, { backgroundColor: colors.undetlay, zIndex: 0 }]}>
		<Ionicons name={"play"} size={30} color="#fff" style={{ marginRight: -4 }} />
	</TouchableHighlight>);

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
						messageStatus === availableStatus.downloading ? TransferMode : messageStatus === availableStatus.download && DownloadMode
					}
				</View>
			</TouchableHighlight>
		);
	};

	const setDuration = (e: any) => {
		const newDuration = e?.durationMillis;
		// if (!vidDuration?.duration) {
		// 	setVideosDuration(v => [...v, { duration: newDuration, id: Message._id }]);
		// };
		if (!duration) {
			setMessages(m => m.map(e => {
				if (e._id === Message._id) {
					return { ...e, duration: newDuration }
				} else {
					return e
				}
			}))
		}
		// if (duration) {
		// 	setVideosDuration(v => v.map(n => {
		// 		if (n.id === duration.id) {
		// 			return { duration: newDuration, id: n.id }
		// 		} else {
		// 			return n
		// 		}
		// 	}))
		// } else {
		// 	setVideosDuration(v => [...v, { duration: newDuration, id: Message._id }]);
		// }
	};

	return (
		<>
			<Pressable style={{ zIndex: 5 }} onPress={onPlayVideo}>
				<Video
					// @ts-ignore
					source={{ uri: Message?.video?.startsWith('file') ? Message?.video : undefined }}
					resizeMode={ResizeMode.COVER}
					useNativeControls={false}
					ref={videoRef}
					shouldPlay={false}
					onPlaybackStatusUpdate={setDuration}
					progressUpdateIntervalMillis={100000}
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
					messageStatus === availableStatus.uploading ? TransferMode : messageStatus === availableStatus.available && AvailableMode
				}
				<View style={{ backgroundColor: 'rgba(52, 52, 52, 0.5)', position: "absolute", top: 10, left: 10, paddingVertical: 3, paddingHorizontal: 7, borderRadius: 7 }}>
					<Text style={{ color: '#fff' }}>{formatMillisecondsToTime(duration) ?? "Video"}</Text>
				</View>
			</Pressable>
			{messageStatus === availableStatus.available ? <Pressable style={{ marginRight: 4, padding: 5 }} onPress={() => save({ uri: Message ? Message?.video : undefined })}>
				<Text style={{ color: colors.text, fontWeight: '600', fontSize: 16 }}>Save</Text>
			</Pressable> : null}
		</>
	)
};

export const renderMessageAudio = (props: MessageAudioProps<IMessagePro>, { setMessages, colors, startPlayingByItem, stopPlaying }: renderMessageAudioProps) => {
	const Message = props.currentMessage;
	const isPlaying = Message.playing;
	const messageStatus = Message.availableStatus;

	async function handlePress() {
		if (Message?.file?.startsWith('file') || !Message?.audio || !Message.fileName) return;
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
			})
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

	switch (messageStatus) {
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

	return (
		<>
			<View style={[{ zIndex: 10, position: 'relative', width: 200, height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden', paddingTop: 10 }]}>
				<View style={{ width: 50, height: 50, borderRadius: 50, marginHorizontal: 10, justifyContent: 'center', alignItems: 'center' }}>
					{finalMode}
				</View>
				<View style={{ marginLeft: 0, marginRight: 'auto', width: 130, overflow: 'hidden' }}>
					<MovingText disable={isPlaying ? false : true} animationThreshold={15} style={[{ color: color, size: 10 }]}>{Message?.fileName ? Message?.fileName : 'Voice'}</MovingText>
				</View>
			</View>
			<View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'flex-end', gap: 10, paddingRight: 10, marginBottom: 5 }}>
				<Text style={{ color, fontWeight: '500', fontSize: 14 }}>{time}</Text>
				{messageStatus === availableStatus.available ? <Pressable onPress={() => save({ uri: Message ? Message?.audio : undefined })}>
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
