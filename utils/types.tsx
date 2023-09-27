export type LoginNavigationProps = {
    LoginPrev: undefined;
    Login: undefined;
    Chat: undefined;
};

export type RootStackParamList = {
    LoginNavigation?: undefined;
    Chat: { setChat: React.Dispatch<React.SetStateAction<number>> };
    Messaging: { contact: User | undefined };
};

export type User = {
    _id: string;
    name: string;
    avatar: string;
};

export type Room = {
	id: string,
	users: User[],
	messages: Message[]
}

export type Message = {
    _id: string | number
    text: string
    createdAt: Date | number
    user: User
    image?: string
    video?: string
    audio?: string
    system?: boolean
    sent?: boolean
    received?: boolean
    pending?: boolean
    quickReplies?: QuickReplies
  }

  interface Reply {
    title: string
    value: string
    messageId?: any
  }
  
  interface QuickReplies {
    type: 'radio' | 'checkbox'
    values: Reply[]
    keepIt?: boolean
  }