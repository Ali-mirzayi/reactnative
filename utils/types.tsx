import { DrawerLayoutAndroid } from "react-native";
import { IMessage } from "react-native-gifted-chat";

export type FullStackNavigationProps = {
    LoginPrev: undefined;
    Login: undefined;
    Chat: { setChat: React.Dispatch<React.SetStateAction<number>>,beCheck:boolean };
    Messaging: { contact: User | undefined,id?: string};
};

export type LoginNavigationProps = {
    LoginPrev: undefined;
    Login:{ setChat: React.Dispatch<React.SetStateAction<number>>,beCheck:boolean };
    // Login: undefined;
    Chat: { setChat: React.Dispatch<React.SetStateAction<number>>,beCheck:boolean };
};
export type ChatNavigationProps = {
    Chat: { setChat: React.Dispatch<React.SetStateAction<number>>,beCheck:boolean };
    Messaging: { contact: User | undefined,id?: string};
};

// export type RootStackParamList = {
//     LoginNavigation?: undefined;
//     ChatNavigation?: undefined;
// };
export type RootStackParamList = {
    LoginNavigation?: undefined;
    Chat: { setChat: React.Dispatch<React.SetStateAction<number>>,beCheck:boolean };
    Messaging: { contact: User | undefined,id?: string};
};
// export type RootStackParamList = {
//     LoginPrev: undefined;
//     Login: undefined;
//     Chat: { setChat: React.Dispatch<React.SetStateAction<number>>,beCheck:boolean };
//     Messaging: { contact: User | undefined,id?: string};
// };

export type User = {
    _id: string;
    name: string;
    avatar: string;
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