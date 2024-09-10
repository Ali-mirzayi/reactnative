import { GiftedChat } from "react-native-gifted-chat";
import baseURL from "../utils/baseURL";
import { availableStatus, IMessagePro, RecordingEnum, User } from "../utils/types";
import { generateID, isMusicFile } from "../utils/utils";
import * as FileSystem from "expo-file-system";
import { Audio } from "expo-av";
import * as MediaLibrary from 'expo-media-library';

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
    // setMessages: React.Dispatch<React.SetStateAction<IMessagePro[]>>,
    setUploading: (callback: (prev: (string | number)[]) => (string | number)[]) => void,
    setErrors: (callback: (prev: (string | number)[]) => (string | number)[]) => void,
};


export async function sendMedia({ uri, type, name, mimeType, duration, roomId, setErrors, setMessages, user, socket, setUploading }: sendMediaProps) {
    const id = generateID();
    if (type === 'image' && uri) {
        // setUploading(e => [...e, id]);
        setMessages((prevMessages: IMessagePro[]) => GiftedChat.append(prevMessages, [{ _id: id, text: "", createdAt: new Date(), user, image: uri, mimeType, availableStatus: availableStatus.uploading }]));
        const response = await FileSystem.uploadAsync(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file', mimeType });
        if (response.body === "ok") {
            socket?.emit('sendImage', { _id: id, text: "", createdAt: new Date(), user, roomId, mimeType }, setUploading(e => e.filter(r => r !== id)));
        } else {
            setErrors(e => [...e, id]);
        }
    } else if (type === 'video' && uri) {
        // setUploading(e => [...e, id]);
        setMessages((prevMessages: IMessagePro[]) => GiftedChat.append(prevMessages, [{ _id: id, text: "", createdAt: new Date(), user, video: uri, mimeType, availableStatus: availableStatus.uploading }]));
        const response = await FileSystem.uploadAsync(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file', mimeType })
        if (response.body === "ok") {
            socket?.emit('sendVideo', { _id: id, text: "", createdAt: new Date(), user, roomId, mimeType }, setUploading(e => e.filter(r => r !== id)));
        } else {
            setErrors(e => [...e, id]);
        }
    } else if (type === 'file' && uri) {
        setUploading(e => [...e, id]);
        const isMusic = isMusicFile(name);
        if (isMusic) {
            const { sound, status } = await Audio.Sound.createAsync({ uri }, { shouldPlay: false });
            // @ts-ignore
            setMessages((prevMessages: IMessagePro[]) => GiftedChat.append(prevMessages, [{ _id: id, text: "", createdAt: new Date(), user, audio: uri, fileName: name, duration: status?.durationMillis, playing: false, availableStatus: availableStatus.uploading }]));
            await sound.unloadAsync();
            const response = await FileSystem.uploadAsync(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file' })
            if (response.body === "ok") {
                // @ts-ignore
                socket?.emit('sendAudio', { _id: id, text: "", createdAt: new Date(), user, roomId, fileName: name, duration: status?.durationMillis, mimeType,availableStatus:availableStatus.download }, setMessages(e => e.map(message => {
                    if (message._id === id){
                        return {...message, availableStatus:availableStatus.available}
                    } else {
                        return message
                    }
                })));
                // socket?.emit('sendAudio', { _id: id, text: "", createdAt: new Date(), user, roomId, fileName: name, duration: status?.durationMillis, mimeType }, setUploading(e => e.filter(r => r !== id)));
            } else {
                setErrors(e => [...e, id]);
            }
        } else {
            setMessages((prevMessages: IMessagePro[]) => GiftedChat.append(prevMessages, [{ _id: id, text: "", createdAt: new Date(), user, file: uri, fileName: name, mimeType, availableStatus: availableStatus.uploading }]));
            const response = await FileSystem.uploadAsync(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file' })
            if (response.body === "ok") {
                socket?.emit('sendFile', { _id: id, text: "", createdAt: new Date(), user, roomId, fileName: name, mimeType }, setUploading(e => e.filter(r => r !== id)));
            } else {
                setErrors(e => [...e, id]);
            }
        }
    } else if (type === 'audio' && uri) {
        setUploading(e => [...e, id]);
        setMessages((prevMessages: IMessagePro[]) => GiftedChat.append(prevMessages, [{ _id: id, text: "", createdAt: new Date(), user, audio: uri, fileName: name, duration, playing: false, availableStatus: availableStatus.uploading }]));
        const response = await FileSystem.uploadAsync(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file' })
        if (response.body === "ok") {
            socket?.emit('sendAudio', { _id: id, text: "", createdAt: new Date(), user, roomId, fileName: name, duration, mimeType }, setUploading(e => e.filter(r => r !== id)));
        } else {
            setErrors(e => [...e, id]);
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
    // setMessages: React.Dispatch<React.SetStateAction<IMessagePro[]>>,
    setUploading: (callback: (prev: (string | number)[]) => (string | number)[]) => void,
    setErrors: (callback: (prev: (string | number)[]) => (string | number)[]) => void,
};


export async function stopRecording({ setRecording, roomId, setErrors, setMessages, setUploading, socket, user }: stopRecordingProps) {
    setRecording({ playing: false, status: RecordingEnum.stop });
    await recordingObg?.stopAndUnloadAsync();
    const duration = recordingObg?._finalDurationMillis
    const uri = recordingObg?.getURI();
    sendMedia({ uri, type: "audio", duration, setErrors, setMessages, setUploading, roomId, socket, user, name: "voice" });
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
    console.log('first')
    if (!uri) return;
    const { granted } = await MediaLibrary.requestPermissionsAsync();
    if (granted) {
        try {
            await MediaLibrary.createAssetAsync(uri);
            //   MediaLibrary.createAlbumAsync('Mirzagram', asset, false)
            //     .then(() => {
            //       console.log('File Saved Successfully!');
            //     })
            //     .catch((e) => {
            //       console.log(e,'Error In Saving File!');
            //     });
        } catch (error) {
            console.log(error);
        }
    } else {
        console.log('Need Storage permission to save file');
    }
}