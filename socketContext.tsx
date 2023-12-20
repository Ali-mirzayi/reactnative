import React, { createContext, useState } from 'react';
import { Socket } from 'socket.io-client';
import { User } from './utils/types';
import { create } from 'zustand';

interface useSocket {
	socket: Socket | null
	setSocket: (e: Socket) => void
}
interface useDarkMode {
	darkMode: boolean
	setDarkMode: (e: boolean) => void
}
interface useUser {
	user: User | undefined
	setUser: (e: User) => void
}

export const useSocket = create<useSocket>()((set) => ({
	socket: null,
	setSocket: (e) => set({ socket: e })
}));

export const useDarkMode = create<useDarkMode>()((set) => ({
	darkMode: true,
	setDarkMode: (e) => set({ darkMode: !e })
}));

export const useUser = create<useUser>()((set) => ({
	user: undefined,
	setUser: (e) => set({ user: e })
}));


export const socketContext = createContext({});

// export default function Context({ children }: any) {
// 	const [socket, setSocket] = useState<Socket | null>(null);
// 	const [user, setUser] = useState<User | undefined>();
// 	// useEffect(() => {
// 	// 	// Connect to the Socket.IO server
// 	// 	const newSocket = io(baseURL());
// 	// 	setSocket(newSocket);
// 	// 	// Clean up on component unmount
// 	// 	return () => {
// 	// 		newSocket.disconnect();
// 	// 	};
// 	// }, []);

// 	return <socketContext.Provider value={{ socket, user, setUser }}>
// 		{children}
// 	</socketContext.Provider>
// }