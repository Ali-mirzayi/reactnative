import { GiftedChat } from "react-native-gifted-chat";
import baseURL from "../utils/baseURL";
import { availableStatus, IMessagePro, RecordingEnum, User, videoDuration } from "../utils/types";
import { generateID, isMusicFile } from "../utils/utils";
import * as FileSystem from "expo-file-system";
import { Audio } from "expo-av";
import * as MediaLibrary from 'expo-media-library';
import { getAudioMetadata } from '@missingcore/audio-metadata';
import { ensureDirExists, fileDirectory } from "../utils/directories";
import Toast from "react-native-toast-message";

const wantedTags = ['artist', 'name', 'artwork'] as const;

let recordingObg: Audio.Recording | undefined = undefined;

type sendMediaProps = {
    user: User,
    roomId: any,
    uri?: string | null,
    socket: any,
    type?: "image" | "video" | "file" | "audio",
    name?: string,
    mimeType?: string,
    duration?: number,
    setMessages: (callback: (prev: IMessagePro[] | []) => (IMessagePro[] | [])) => void,
    videosDuration?: [] | videoDuration[]
};

export async function sendMedia({ uri, type, name, mimeType, duration, roomId, setMessages, user, socket, videosDuration }: sendMediaProps) {
    const id = generateID();
    if (type === 'image' && uri) {
        setMessages((prevMessages: IMessagePro[]) => GiftedChat.append(prevMessages, [{ _id: id, text: "", createdAt: new Date(), user, image: uri, mimeType, availableStatus: availableStatus.uploading }]));
        const response = await FileSystem.uploadAsync(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file', mimeType });
        if (response.body === "ok") {
            socket?.emit('sendImage', { _id: id, text: "", createdAt: new Date(), user, roomId, mimeType, availableStatus: availableStatus.download }, setMessages(e => e.map(message => {
                if (message._id === id) {
                    return { ...message, availableStatus: availableStatus.available }
                } else {
                    return message
                }
            })));
        } else {
            console.log('error uploading image')
        }
    } else if (type === 'video' && uri) {
        setMessages((prevMessages: IMessagePro[]) => GiftedChat.append(prevMessages, [{ _id: id, text: "", createdAt: new Date(), user, video: uri, mimeType, availableStatus: availableStatus.uploading }]));
        const response = await FileSystem.uploadAsync(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file', mimeType })
        if (response.body === "ok") {
            // console.log(videosDuration,'first',videosDuration?.find(e=>e.id===id),id)
            socket?.emit('sendVideo', { _id: id, text: "", createdAt: new Date(), user, roomId, mimeType, availableStatus: availableStatus.download }, setMessages(e => e.map(message => {
                if (message._id === id) {
                    return { ...message, availableStatus: availableStatus.available }
                } else {
                    return message
                }
            })));
        } else {
            console.log('error uploading video');
        }
    } else if (type === 'file' && uri) {
        const isMusic = isMusicFile(name);
        if (isMusic) {
            const data = await getAudioMetadata(uri, wantedTags).catch(e => console.log(e));
            let artwork = data?.metadata.artwork?.replace(/^data:image\/[^;]+;base64,/, '');
            if (artwork) {
                await ensureDirExists();
                await FileSystem.writeAsStringAsync(fileDirectory + `${name}-artwork.jpeg`, artwork, { encoding: "base64" }).then(() => {
                    artwork = fileDirectory + `${name}-artwork.jpeg`
                }).catch((e) => {
                    console.log(e, 'eeeeeeeeeeeeeeee')
                })
            }
            const { sound, status } = await Audio.Sound.createAsync({ uri }, { shouldPlay: false });
            // @ts-ignore
            setMessages((prevMessages: IMessagePro[]) => GiftedChat.append(prevMessages, [{ _id: id, text: "", createdAt: new Date(), user, audio: uri, fileName: name, duration: status?.durationMillis, playing: false, availableStatus: availableStatus.uploading, artwork: artwork?.startsWith('file') ? artwork : undefined, musicArtist: data?.metadata.artist ?? 'Artist', musicName: data?.metadata.name ?? name }]));
            await sound.unloadAsync();
            const response = await FileSystem.uploadAsync(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file' })
            if (response.body === "ok") {
                // @ts-ignore
                socket?.emit('sendAudio', { _id: id, text: "", createdAt: new Date(), user, roomId, fileName: name, duration: status?.durationMillis, mimeType, availableStatus: availableStatus.download }, setMessages(e => e.map(message => {
                    if (message._id === id) {
                        return { ...message, availableStatus: availableStatus.available }
                    } else {
                        return message
                    }
                })));
            } else {
                console.log('error uploading music');
            }
        } else {
            setMessages((prevMessages: IMessagePro[]) => GiftedChat.append(prevMessages, [{ _id: id, text: "", createdAt: new Date(), user, file: uri, fileName: name, mimeType, availableStatus: availableStatus.uploading }]));
            const response = await FileSystem.uploadAsync(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file' })
            if (response.body === "ok") {
                socket?.emit('sendFile', { _id: id, text: "", createdAt: new Date(), user, roomId, fileName: name, mimeType, availableStatus: availableStatus.download }, setMessages(e => e.map(message => {
                    if (message._id === id) {
                        return { ...message, availableStatus: availableStatus.available }
                    } else {
                        return message
                    }
                })));
            } else {
                console.log('error uploading file');
            }
        }
    } else if (type === 'audio' && uri) {
        setMessages((prevMessages: IMessagePro[]) => GiftedChat.append(prevMessages, [{ _id: id, text: "", createdAt: new Date(), user, audio: uri, fileName: name, duration, playing: false, availableStatus: availableStatus.uploading }]));
        const response = await FileSystem.uploadAsync(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file' })
        if (response.body === "ok") {
            socket?.emit('sendAudio', { _id: id, text: "", createdAt: new Date(), user, roomId, fileName: name, duration, mimeType }, setMessages(e => e.map(message => {
                if (message._id === id) {
                    return { ...message, availableStatus: availableStatus.available }
                } else {
                    return message
                }
            })));
        } else {
            console.log('error uploading audio');
        }
    }
};

type startRecordingProps = {
    setRecording: React.Dispatch<React.SetStateAction<{
        playing: boolean;
        status: RecordingEnum;
    } | undefined>>,
    handleAudioPermissions: () => Promise<boolean>,
    permissionResponse: Audio.PermissionResponse | null
};

export async function startRecording({ setRecording, handleAudioPermissions, permissionResponse }: startRecordingProps) {
    try {
        setRecording({ playing: true, status: RecordingEnum.start });
        if (permissionResponse?.status !== 'granted') {
            await handleAudioPermissions();
            return;
        };
        recordingObg = new Audio.Recording();
        await recordingObg.prepareToRecordAsync(
            Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        await recordingObg.startAsync();
    } catch (err) {
        recordingObg = undefined;
        setRecording({ playing: false, status: RecordingEnum.cancel });
    }
};

type stopRecordingProps = {
    setRecording: React.Dispatch<React.SetStateAction<{
        playing: boolean;
        status: RecordingEnum;
    } | undefined>>,
    recording: undefined | { record?: Audio.Recording, playing: boolean },
    user: User,
    roomId: any,
    socket: any,
    setMessages: (callback: (prev: IMessagePro[] | []) => (IMessagePro[] | [])) => void,
};


export async function stopRecording({ setRecording, roomId, setMessages, socket, user }: stopRecordingProps) {
    setRecording({ playing: false, status: RecordingEnum.stop });
    await recordingObg?.stopAndUnloadAsync();
    const duration = recordingObg?._finalDurationMillis
    const uri = recordingObg?.getURI();
    sendMedia({ uri, type: "audio", duration, setMessages, roomId, socket, user, name: "voice" });
    recordingObg = undefined;
};

type cancelRecordingProps = {
    setRecording: React.Dispatch<React.SetStateAction<{
        playing: boolean;
        status: RecordingEnum;
    } | undefined>>,
    recording: undefined | { record?: Audio.Recording, playing: boolean }
};


export async function cancelRecording({ setRecording }: cancelRecordingProps) {
    setRecording({ playing: false, status: RecordingEnum.stop });
    await recordingObg?.stopAndUnloadAsync();
    recordingObg = undefined;
};

export const save = async ({ uri }: { uri: string | undefined }) => {
    if (!uri) return;
    const { granted } = await MediaLibrary.requestPermissionsAsync();
    if (granted) {
        try {
            await MediaLibrary.createAssetAsync(uri).then(() => {
                Toast.show({
                    type: 'success',
                    text1: 'file saved.',
                    autoHide: true,
                    visibilityTime: 2500
                });
            });
        } catch (error) {
            console.log(error);
            Toast.show({
                type: 'error',
                text2: 'error cant save.',

                autoHide: true,
                visibilityTime: 3000,
            });
        }
    } else {
        console.log('Need Storage permission to save file');
        Toast.show({
            type: 'error',
            text1: 'error cant save.',
            autoHide: true,
            visibilityTime: 3000
        });
    }
}