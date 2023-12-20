import { IMessage } from "react-native-gifted-chat";

export type LoginNavigationProps = {
    LoginPrev: undefined;
    Login: undefined;
    Chat: undefined;
};

export type RootStackParamList = {
    LoginNavigation?: undefined;
    Chat: { setChat: React.Dispatch<React.SetStateAction<number>>,beCheck:boolean };
    Messaging: { contact: User | undefined,id?: string};
};

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