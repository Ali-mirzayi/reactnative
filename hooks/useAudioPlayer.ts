import React, { useRef } from 'react'
import { useIsOpen, useIsPlaying, useLastTrack, usePlayer, usePosition } from '../socketContext';
import { audioListType, useAudioList } from './useAudioList';
import { Audio } from 'expo-av';

function useAudioPlayer() {
    const { player, setPlayer } = usePlayer();
    const { currentPosition, setCurrentPosition } = usePosition();
    const { lastTrack, setLastTrack } = useLastTrack();
    const previousPositionRef = useRef<number | null>(null);
    const AudioList = useAudioList();
    const filteredAudioList = AudioList.filter(audio => audio.audioName !== "voice");

    const track = AudioList.find(audio => audio.id === player?.id);

    const { open: isPlayerOpen, setOpen: setIsOpen } = useIsOpen();
    const setPlayerStatus = useIsPlaying(state=> state.setPlayerStatus);

    const stopPlaying = async ({ isForStart, isEnded }: { isForStart: boolean, isEnded: boolean }) => {
        if (!player?.track) return;
        const status = await player.track.getStatusAsync();
        await player.track.stopAsync();
        await player.track.unloadAsync();

        //@ts-ignore
        const lastPosition = isEnded ? undefined : status.positionMillis;

        setPlayer((e) => {
            return { uri: undefined, track: undefined, name: undefined, id: e?.id, uuid: undefined, duration: undefined, lastPosition, playing: isForStart ? true : false };
        });

        setCurrentPosition((e) => ({ position: lastPosition, id: e?.id }));

        setPlayerStatus(()=>{
            return {isPlaying:false,id:player.id}
        });
    };

    const startPlaying = async () => {
        if (!track?.uri) return;

        setPlayer((e) => {
            return { ...e, uri: track?.uri, id: track?.id };
        });

        await stopPlaying({ isEnded: false, isForStart: true });

        const { sound: newSound, status } = await Audio.Sound.createAsync(
            { uri: track.uri },
            { isLooping: false, progressUpdateIntervalMillis: 1000, shouldPlay: false }
        );

        if (player?.lastPosition) {
            await newSound.playFromPositionAsync(player?.lastPosition)
        } else {
            setCurrentPosition(() => ({ id: player?.uuid, position: undefined }));
            await newSound.playAsync();
        };

        setPlayer((e) => {
            //@ts-ignore
            return { ...e, track: newSound, name: track.audioName, uuid: track.id, duration: status?.durationMillis, playing: true }
        });

        setPlayerStatus(()=>{
            return {isPlaying:true,id:track.id}
        });
    };

    const startPlayingByItem = async ({ item, isMessage }: { item: audioListType, isMessage?: boolean }) => {
        if (!item?.uri) return;
        setPlayer((e) => {
            return { ...e, uri: item?.uri, id: item?.id };
        });

        // this is for if startPlayingByItem called from messaging open floatingMusicPlayer
        if (isMessage) setIsOpen(true);

        await stopPlaying({ isForStart: true, isEnded: false });

        const { sound: newSound, status } = await Audio.Sound.createAsync(
            { uri: item.uri },
            { isLooping: false, progressUpdateIntervalMillis: 1000, shouldPlay: false }
        );

        if (currentPosition.id === item.id && currentPosition.position) {
            await newSound.playFromPositionAsync(currentPosition.position);
        } else {
            await newSound.playAsync();
            setCurrentPosition(() => ({ id: item.id, position: undefined }));
        }

        setPlayer(() => {
            //@ts-ignore
            return { track: newSound, name: item.audioName, uri: item.uri, uuid: item.id, duration: status?.durationMillis, id: item.id, playing: true }
        });

        setPlayerStatus(()=>{
            return {isPlaying:true,id:item.id}
        });
    };

    const startPlyingList = async ({ indexJump }: { indexJump: number }) => {
        const currentTrackIndex = filteredAudioList.findIndex(audio => audio.id === player?.id);

        if (currentTrackIndex === -1) return;
        const forwardTrack = filteredAudioList.length === currentTrackIndex + indexJump ? filteredAudioList[0] : filteredAudioList[currentTrackIndex + indexJump];
        setPlayer((e) => {
            return { ...e, uri: forwardTrack.uri, id: forwardTrack.id };
        });

        await stopPlaying({ isEnded: false, isForStart: true });

        const { sound: newSound, status } = await Audio.Sound.createAsync(
            { uri: forwardTrack.uri },
            { isLooping: false, progressUpdateIntervalMillis: 1000, shouldPlay: true }
        );

        setCurrentPosition(() => ({ id: forwardTrack.id, position: undefined }));

        setPlayer(() => {
            //@ts-ignore
            return { track: newSound, name: forwardTrack.audioName, uri: forwardTrack.uri, uuid: forwardTrack.id, duration: status?.durationMillis, id: forwardTrack.id, playing: true }
        });

        setPlayerStatus(()=>{
            return {isPlaying:true,id:forwardTrack.id}
        });
    };

    const shufflePlayList = async () => {
        const currentTrackIndex = filteredAudioList.findIndex(audio => audio.id === player?.id);
        if (currentTrackIndex === -1) return;
        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * filteredAudioList.length);
        } while (randomIndex === currentTrackIndex);
        const forwardTrack = filteredAudioList[randomIndex];
        setPlayer((e) => {
            return { ...e, uri: forwardTrack.uri, id: forwardTrack.id };
        });
        await stopPlaying({ isEnded: false, isForStart: true });
        const { sound: newSound, status } = await Audio.Sound.createAsync(
            { uri: forwardTrack.uri },
            { isLooping: false, progressUpdateIntervalMillis: 1000, shouldPlay: true }
        );

        setCurrentPosition(() => ({ id: forwardTrack.id, position: undefined }));

        setPlayer(() => {
            //@ts-ignore
            return { track: newSound, name: forwardTrack.audioName, uri: forwardTrack.uri, uuid: forwardTrack.id, duration: status?.durationMillis, id: forwardTrack.id, playing: true }
        });

        setPlayerStatus(()=>{
            return {isPlaying:true,id:forwardTrack.id}
        });
    };

    const playForward = async ({ indexJump }: { indexJump: 1 | -1 }) => {
        const currentTrackIndex = filteredAudioList.findIndex(audio => audio.id === player?.id);
        if (currentTrackIndex === -1) return;
        if (indexJump === -1 && Number(currentPosition.position) >= 2000) {
            player?.track?.playFromPositionAsync(0);
            return;
        }
        const forwardTrack = filteredAudioList.length === currentTrackIndex + indexJump ? filteredAudioList[0] : filteredAudioList[currentTrackIndex + indexJump];
        setPlayer((e) => {
            return { ...e, uri: forwardTrack.uri, id: forwardTrack.id };
        });

        await stopPlaying({ isForStart: true, isEnded: false });

        const { sound: newSound, status } = await Audio.Sound.createAsync(
            { uri: forwardTrack.uri },
            { isLooping: false, progressUpdateIntervalMillis: 1000, shouldPlay: false }
        );

        if (currentPosition.id === forwardTrack.id && currentPosition.position) {
            await newSound.playFromPositionAsync(currentPosition.position);
        } else {
            await newSound.playAsync();
            setCurrentPosition(() => ({ id: forwardTrack.id, position: undefined }));
        }

        setPlayer(() => {
            //@ts-ignore
            return { track: newSound, name: forwardTrack.audioName, uri: forwardTrack.uri, uuid: forwardTrack.id, duration: status?.durationMillis, id: forwardTrack.id, playing: true }
        });

        setPlayerStatus(()=>{
            return {isPlaying:true,id:forwardTrack.id}
        });
    };

    return { startPlaying, startPlayingByItem, startPlyingList, stopPlaying, shufflePlayList, playForward }
}

export default useAudioPlayer;