import { DrawerLayoutAndroid } from "react-native";
import { IMessage } from "react-native-gifted-chat";
import * as Notifications from "expo-notifications";

export type LoginNavigationProps = {
    LoginPrev: undefined;
    Login:{ beCheck:boolean };
    Chat: { beCheck:boolean };
};

export type ChatNavigationProps = {
    Chat: { beCheck:boolean };
    Messaging: { contact: User | undefined,roomId: string,setLastMessage:React.Dispatch<React.SetStateAction<[] | LastMessageType[]>>};
};

export type RootStackParamList = {
    LoginNavigation?: undefined;
    Chat: { beCheck:boolean };
    Messaging: { contact: User | undefined,roomId: string,setLastMessage:React.Dispatch<React.SetStateAction<[] | LastMessageType[]>>};
};

export type IMessagePro = IMessage & { fileName?: string, file?:string, mimType?: string , preView?: string, thumbnail?: string }

export type User = {
    _id: string;
    name: string;
    avatar: string;
    token: Notifications.ExpoPushToken | undefined;
};

export type Room = {
	id: string,
	users: [user:User,contact:User],
	messages: IMessagePro[]
}

export type DrawerCoreType = {
    darkMode:boolean,
    setDarkMode:React.Dispatch<React.SetStateAction<boolean>>,
    beCheck:boolean,
    name:string | undefined,
    children:React.ReactNode,
    drawerRef:React.RefObject<DrawerLayoutAndroid>
}

export type CountNewMessageType = {
    count: number;
    id: string;
}

export type LastMessageType = {
    message: string;
    roomId: string;
}