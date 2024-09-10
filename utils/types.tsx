import { IMessage } from "react-native-gifted-chat";
import * as Notifications from "expo-notifications";
import { Audio } from "expo-av";

export enum availableStatus {
    "available" = 0,
    "downloading" = 1,
    "download" = 2,
    "uploading" = 3,
    "error" = 4,
};

export type LoginNavigationProps = {
    LoginPrev: undefined;
    Login: { beCheck: boolean };
    Chat: { beCheck: boolean };
};

export type ChatNavigationProps = {
    Chat: { beCheck: boolean };
    Messaging: { contact: User | undefined, roomId: string };
};

export type RootStackParamList = {
    LoginNavigation?: undefined;
    Chat: { beCheck: boolean };
    Messaging: { contact: User | undefined, roomId: string };
    ModalMusic: undefined;
};

export type IMessagePro = IMessage & {
    fileName?: string,
    file?: string,
    mimeType?: string,
    preView?: string,
    thumbnail?: string,
    duration?: number,
    playing?: boolean,
    availableStatus?: availableStatus
}

export type User = {
    _id: string;
    name: string;
    avatar: string;
    token: Notifications.ExpoPushToken | undefined;
};

export type Room = {
    id: string,
    users: [user: User, contact: User],
    messages: IMessagePro[]
}

export type DrawerCoreType = {
    darkMode: boolean,
    setDarkMode: React.Dispatch<React.SetStateAction<boolean>>,
    children: React.ReactNode,
    open: boolean,
    setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export type CountNewMessageType = {
    count: number;
    id: string;
}

export type LastMessageType = {
    message: string;
    roomId: string;
}

export type player = {
    name?: string,
    uri?: string,
    playing?: boolean,
    id?: string | number,
    duration?: number,
    track?: Audio.Sound,
    lastPosition?: number,
    uuid?: string | number
} | undefined;

export type currentPosition = {
    position?: number,
    id?: number | string
};

export type lastTrack = {
    duration?: number,
    name?: string,
    id?: number | string,
    uri?: string
};

export enum RecordingEnum {
    "start" = 0,
    "stop" = 1,
    "cancel" = 2,
}

export enum repeatModeEnum {
    disabledRepeat = 0,
    repeatTrack = 1,
    repeatList = 2,
    suffleList = 3,
};

export type playerStatus = { isPlaying: boolean, id?: string | number }

export type videoDuration = { duration?: number, id?: string | number }