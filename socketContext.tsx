import { Socket } from 'socket.io-client';
import { currentPosition, IMessagePro, LastMessageType, lastTrack, player, playerStatus, User } from './utils/types';
import { create } from 'zustand';

const initialCurrentPosition: currentPosition = {
	position: undefined,
	id: undefined
};

const initialLastTrack: lastTrack = {
	duration: undefined,
	id: undefined,
	name: undefined,
	uri: undefined
};

interface useMessage {
	messages: IMessagePro[] | [],
	setMessages: (callback: (prev: IMessagePro[] | []) => (IMessagePro[] | [])) => void
}
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
interface useCurrentContact {
	contact: User | undefined
	setContact: (e: User) => void
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

interface useSetLastMessage {
	lastMessage: LastMessageType[] | []
	setLastMessage: (callback: (prev: LastMessageType[] | []) => (LastMessageType[] | [])) => void
}
interface usePlayer {
	player: player
	setPlayer: (callback: (prev: player) => (player)) => void
}
interface usePosition {
	currentPosition: currentPosition
	setCurrentPosition: (callback: (prev: currentPosition) => (currentPosition)) => void
}

interface useLastTrack {
	lastTrack: lastTrack
	setLastTrack: (callback: (prev: lastTrack) => (lastTrack)) => void
}

interface useBeCheck {
	beCheck: boolean
	setBeCheck: (e: boolean) => void
}

interface useIsOpen {
	open: boolean
	setOpen: (e: boolean) => void
}
interface useIsPlaying {
	playerStatus: playerStatus
	setPlayerStatus: (callback: (prev: playerStatus) => (playerStatus)) => void
}

export const useMessage = create<useMessage>()((set) => ({
	messages: [],
	setMessages: (callback) => set((state) => ({ messages: callback(state.messages) }))
}));

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

export const useCurrentContact = create<useCurrentContact>()((set) => ({
	contact: undefined,
	setContact: (e) => set({ contact: e })
}));

export const useForceRerender = create<useForceRerender>()((set) => ({
	forceRerender: false,
	setForceRerender: () => set((state) => ({ forceRerender: !state.forceRerender }))
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

export const useSetLastMessage = create<useSetLastMessage>()((set) => ({
	lastMessage: [],
	setLastMessage: (callback) => set((state) => ({ lastMessage: callback(state.lastMessage) })),
}));

export const usePlayer = create<usePlayer>()((set) => ({
	player: undefined,
	setPlayer: (callback) => set((state) => ({ player: callback(state.player) })),
}));

export const useBeCheck = create<useBeCheck>()((set) => ({
	beCheck: false,
	setBeCheck: (e) => set({ beCheck: e })
}));

export const usePosition = create<usePosition>()((set) => ({
	currentPosition: initialCurrentPosition,
	setCurrentPosition: (callback) => set((state) => ({ currentPosition: callback(state.currentPosition) }))
}));

export const useLastTrack = create<useLastTrack>()((set) => ({
	lastTrack: initialLastTrack,
	setLastTrack: (callback) => set((state) => ({ lastTrack: callback(state.lastTrack) })),
}));

//for open or close FloatingMusicPlayer  useIsOpen
export const useIsOpen = create<useIsOpen>()((set) => ({
	open: false,
	setOpen: (e) => set({ open: e })
}));

export const useIsPlaying = create<useIsPlaying>()((set) => ({
	playerStatus: { isPlaying: false, id: undefined },
	setPlayerStatus: (callback) => set((state) => ({ playerStatus: callback(state.playerStatus) })),
}));
