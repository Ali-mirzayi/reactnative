import { GiftedChat } from "react-native-gifted-chat";
import baseURL from "../utils/baseURL";
import { IMessagePro, RecordingEnum, User } from "../utils/types";
import { generateID, isMusicFile } from "../utils/utils";
import * as FileSystem from "expo-file-system";
import { Audio } from "expo-av";
import { Animated, Easing } from "react-native";

let recordingObg: Audio.Recording | undefined = undefined;
// let recordingObg = new Audio.Recording();

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

type startRecordingProps = {
    setRecording: React.Dispatch<React.SetStateAction<{
        record?: Audio.Recording;
        playing: boolean;
        status: RecordingEnum;
    } | undefined>>,
    handleAudioPermissions: () => Promise<boolean>,
        //@ts-ignore
        pan: Animated.Value,
};

export async function startRecording({ setRecording, handleAudioPermissions,pan }: startRecordingProps) {
    try {
        const per = await handleAudioPermissions();
        if (!per) return;
        recordingObg = new Audio.Recording();

        await recordingObg.prepareToRecordAsync(
            Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        await recordingObg.startAsync();
        setRecording({ record: undefined, playing: true, status: RecordingEnum.start });
    } catch (err) {
        recordingObg = undefined;
        setRecording({ record: undefined, playing: false, status: RecordingEnum.cancel });
        Animated.spring(pan, {
            toValue: 0, // Reset to 0  
            useNativeDriver: true, // Set to true for better performance if possible  
            bounciness: 10, // Optional: adjust bounciness  
            speed: 0.2
        }).start(() => {
            // Reset the offset after animation completes  
            pan.setOffset(0);
        });
        console.log('err', err);
    }
};

type stopRecordingProps = {
    setRecording: React.Dispatch<React.SetStateAction<{
        record?: Audio.Recording;
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
    //@ts-ignore
    pan: Animated.Value,
};


export async function stopRecording({ setRecording, roomId, setErrors, setMessages, setUploading, socket, user, pan }: stopRecordingProps) {
    console.log('Stopping 0');
    setRecording({ record: undefined, playing: false, status: RecordingEnum.stop });
    console.log('Stopping 1');
    // await recording?.record?.stopAndUnloadAsync();
    console.log('Stopping 2');
    // console.log(status,'Stopping 3');
    await recordingObg?.stopAndUnloadAsync();
    const duration = recordingObg?._finalDurationMillis
    const uri = recordingObg?.getURI();

    // const uri = recording?.record?._uri;
    console.log(uri, 'Stopping 4', duration);
    // const extension = recording?.record?._options?.android.extension;
    console.log('Stopping 5');
    sendMedia({ uri, type: "audio", duration, setErrors, setMessages, setUploading, roomId, socket, user });
    console.log('Stopping 6');
    recordingObg = undefined;
    Animated.spring(pan, {
        toValue: 0, // Reset to 0  
        useNativeDriver: true, // Set to true for better performance if possible  
        bounciness: 10, // Optional: adjust bounciness  
        speed: 0.2
    }).start(() => {
        // Reset the offset after animation completes  
        pan.setOffset(0);
    });
    console.log('Stopping 7');
};

type cancelRecordingProps = {
    setRecording: React.Dispatch<React.SetStateAction<{
        record?: Audio.Recording;
        playing: boolean;
        status: RecordingEnum;
    } | undefined>>,
    recording: undefined | { record?: Audio.Recording, playing: boolean },
    //@ts-ignore
    pan: Animated.Value,
};


export async function cancelRecording({ setRecording, pan }: cancelRecordingProps) {
    setRecording({ record: undefined, playing: false, status: RecordingEnum.stop });
    await recordingObg?.stopAndUnloadAsync();
    recordingObg = undefined;
    Animated.timing(pan, {  
        toValue: 0,  
        useNativeDriver: true,  
        duration: 3000,     // Higher tension to simulate a heavier feel while returning ,
        easing:Easing.linear 
    }).start(() => {  
        // Reset the offset after animation completes  
        pan.setOffset(0);  
    });  
    
    // pan.setValue(0);
};