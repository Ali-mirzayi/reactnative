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
    Messaging: { contact: User | undefined,id?: string};
};

export type RootStackParamList = {
    LoginNavigation?: undefined;
    Chat: { beCheck:boolean };
    Messaging: { contact: User | undefined,id?: string};
};

export type User = {
    _id: string;
    name: string;
    avatar: string;
    token: Notifications.ExpoPushToken | undefined;
    // token: Notifications.NativeDevicePushToken | undefined;
};

export type Room = {
	id: string,
	users: [user:User,contact:User],
	messages: IMessage[]
}

export type DrawerCoreType = {
    darkMode:boolean,
    setDarkMode:React.Dispatch<React.SetStateAction<boolean>>,
    beCheck:boolean,
    name:string | undefined,
    children:React.ReactNode,
    drawerRef:React.RefObject<DrawerLayoutAndroid>
}