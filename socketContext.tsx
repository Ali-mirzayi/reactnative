import { Socket } from 'socket.io-client';
import { LastMessageType, User } from './utils/types';
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
interface useForceRerender {
	forceRerender: boolean
	setForceRerender: () => void
}

interface useSetDownloading {
	downloading: (string | number)[]
	setDownloading: (callback: (prev: (string | number)[]) => (string | number)[]) => void;
}
interface useSetUploading {
	uploading: (string | number)[]
	setUploading: (callback: (prev: (string | number)[]) => (string | number)[]) => void
}
interface useSetErrors {
	errors: (string | number)[]
	setErrors: (callback: (prev: (string | number)[]) => (string | number)[]) => void
}
interface useLastMessage {
	lastMessage: LastMessageType[] | []
	setLastMessage: (callback: (prev: LastMessageType[]) => LastMessageType[]) => void
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

export const useForceRerender = create<useForceRerender>()((set) => ({
	forceRerender: false,
	setForceRerender: () => set((state)=>({ forceRerender: !state.forceRerender }))
}));

export const useSetDownloading = create<useSetDownloading>()((set) => ({
	downloading: [],
	setDownloading: (callback) => set((state) => ({ downloading: callback(state.downloading) })),
}));

export const useSetUploading = create<useSetUploading>()((set) => ({
	uploading: [],
	setUploading: (callback) => set((state) => ({ uploading: callback(state.uploading) })),
}));

export const useSetErrors = create<useSetErrors>()((set) => ({
	errors: [],
	setErrors: (callback) => set((state) => ({ errors: callback(state.errors) })),
}));

export const useLastMessage = create<useLastMessage>()((set) => ({
	lastMessage: [],
	setLastMessage: (callback) => set((state) => ({ lastMessage: callback(state.lastMessage) })),
}));