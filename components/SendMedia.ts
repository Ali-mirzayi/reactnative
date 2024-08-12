import { GiftedChat } from "react-native-gifted-chat";
import baseURL from "../utils/baseURL";
import { IMessagePro, RecordingEnum, User } from "../utils/types";
import { generateID, isMusicFile } from "../utils/utils";
import * as FileSystem from "expo-file-system";
import { Audio } from "expo-av";

let recordingObg: Audio.Recording | undefined = undefined;

type sendMediaProps = {
    user: User,
    roomId: any,
    uri?: string | null,
    socket: any,
    type?: "image" | "video" | "file" | "audio",
    name?: string,
    mimType?: string,
    duration?: number,
    setMessages: React.Dispatch<React.SetStateAction<IMessagePro[]>>,
    setUploading: (callback: (prev: (string | number)[]) => (string | number)[]) => void,
    setErrors: (callback: (prev: (string | number)[]) => (string | number)[]) => void,
};


export async function sendMedia({ uri, type, name, mimType, duration, roomId, setErrors, setMessages, user, socket, setUploading }: sendMediaProps) {
    const id = generateID();

    if (type === 'image' && uri) {
        setUploading(e => [...e, id]);
        setMessages((prevMessages: IMessagePro[]) => GiftedChat.append(prevMessages, [{ _id: id, text: "", createdAt: new Date(), user, image: uri }]));
        const response = await FileSystem.uploadAsync(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file' });
        if (response.body === "ok") {
            socket?.emit('sendImage', { _id: id, text: "", createdAt: new Date(), user, roomId }, setUploading(e => e.filter(r => r !== id)));
        } else {
            setErrors(e => [...e, id]);
        }
    } else if (type === 'video' && uri) {
        setUploading(e => [...e, id]);
        setMessages((prevMessages: IMessagePro[]) => GiftedChat.append(prevMessages, [{ _id: id, text: "", createdAt: new Date(), user, video: uri }]));
        const response = await FileSystem.uploadAsync(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file' })
        if (response.body === "ok") {
            socket?.emit('sendVideo', { _id: id, text: "", createdAt: new Date(), user, roomId }, setUploading(e => e.filter(r => r !== id)));
        } else {
            setErrors(e => [...e, id]);
        }
    } else if (type === 'file' && uri) {
        setUploading(e => [...e, id]);
        const isMusic = isMusicFile(name);
        if (isMusic) {
            const { sound, status } = await Audio.Sound.createAsync({ uri }, { shouldPlay: false });
            // @ts-ignore
            setMessages((prevMessages: IMessagePro[]) => GiftedChat.append(prevMessages, [{ _id: id, text: "", createdAt: new Date(), user, audio: uri, fileName: name, duration: status?.durationMillis, playing: false }]));
            await sound.unloadAsync();
            const response = await FileSystem.uploadAsync(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file' })
            if (response.body === "ok") {
                // @ts-ignore
                socket?.emit('sendAudio', { _id: id, text: "", createdAt: new Date(), user, roomId, fileName: name, duration: status?.durationMillis }, setUploading(e => e.filter(r => r !== id)));
            } else {
                setErrors(e => [...e, id]);
            }
        } else {
            setMessages((prevMessages: IMessagePro[]) => GiftedChat.append(prevMessages, [{ _id: id, text: "", createdAt: new Date(), user, file: uri, fileName: name, mimType }]));
            const response = await FileSystem.uploadAsync(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file' })
            if (response.body === "ok") {
                socket?.emit('sendFile', { _id: id, text: "", createdAt: new Date(), user, roomId, fileName: name }, setUploading(e => e.filter(r => r !== id)));
            } else {
                setErrors(e => [...e, id]);
            }
        }
    } else if (type === 'audio' && uri) {
        setUploading(e => [...e, id]);
        setMessages((prevMessages: IMessagePro[]) => GiftedChat.append(prevMessages, [{ _id: id, text: "", createdAt: new Date(), user, audio: uri, fileName: name, duration, playing: false }]));
        const response = await FileSystem.uploadAsync(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file' })
        if (response.body === "ok") {
            socket?.emit('sendAudio', { _id: id, text: "", createdAt: new Date(), user, roomId, fileName: name, duration }, setUploading(e => e.filter(r => r !== id)));
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
    permissionResponse:Audio.PermissionResponse | null
};

export async function startRecording({ setRecording, handleAudioPermissions,permissionResponse }: startRecordingProps) {
    try {
        setRecording({ playing: true, status: RecordingEnum.start });
        if(permissionResponse?.status !== 'granted'){
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
    setMessages: React.Dispatch<React.SetStateAction<IMessagePro[]>>,
    setUploading: (callback: (prev: (string | number)[]) => (string | number)[]) => void,
    setErrors: (callback: (prev: (string | number)[]) => (string | number)[]) => void,
};


export async function stopRecording({ setRecording, roomId, setErrors, setMessages, setUploading, socket, user }: stopRecordingProps) {
    setRecording({ playing: false, status: RecordingEnum.stop });
    await recordingObg?.stopAndUnloadAsync();
    const duration = recordingObg?._finalDurationMillis
    const uri = recordingObg?.getURI();
    sendMedia({ uri, type: "audio", duration, setErrors, setMessages, setUploading, roomId, socket, user, name: generateID() });
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