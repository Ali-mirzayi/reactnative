import { Socket } from 'socket.io-client';
import { User } from './utils/types';
import { create } from 'zustand';
import * as Notifications from "expo-notifications";

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
interface useToken {
	token: Notifications.ExpoPushToken | undefined
	setToken: (e: Notifications.ExpoPushToken) => void
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

export const useToken = create<useToken>()((set) => ({
	token: undefined,
	setToken: (e) => set({ token: e })
}));