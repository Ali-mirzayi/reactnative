import { IMessage } from "react-native-gifted-chat";
import * as Notifications from "expo-notifications";

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
};

export type IMessagePro = IMessage & { fileName?: string, file?: string, mimType?: string, preView?: string, thumbnail?: string, duration?: number, playing?: boolean}

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
    // beCheck: boolean,
    children: React.ReactNode,
    open: boolean,
    setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export type CountNewMessageType = {
    count: number;
    id: string;
}

// export type LastMessageType = {
//     count: number;
//     message: string;
//     roomId: string;
// }

export type LastMessageType = {
    message: string;
    roomId: string;
}