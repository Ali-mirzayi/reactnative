import { useIsOpen, useMessage, usePlayer, usePosition } from '../socketContext';
import { audioListType, useAudioList } from './useAudioList';
import { Audio } from 'expo-av';

function useAudioPlayer() {
    const { player, setPlayer } = usePlayer();
    const { currentPosition, setCurrentPosition } = usePosition();
    const AudioList = useAudioList();
    const filteredAudioList = AudioList.filter(audio => audio.audioName !== "voice");
    const setMessages = useMessage(state => state.setMessages);
    const track = AudioList.find(audio => audio.id === player?.id);
    const setIsOpen = useIsOpen(state => state.setOpen);

    const stopPlaying = async ({ isForStart, isEnded }: { isForStart: boolean, isEnded: boolean }) => {
        if (!player?.track) return;
        const status = await player.track.getStatusAsync();
        await player.track.stopAsync();
        await player.track.unloadAsync();

        //@ts-ignore
        const lastPosition = isEnded ? undefined : status.positionMillis;

        setPlayer((e) => {
            return { uri: undefined, track: undefined, name: undefined, id: e?.id, uuid: undefined, duration: undefined, lastPosition, playing: isForStart ? true : false, artist: undefined, artwork: undefined };
        });

        setCurrentPosition((e) => ({ position: lastPosition, id: e?.id }));

        setMessages(e =>
            e.map((item) =>
                item._id === player.id ? { ...item, playing: false } : item
            )
        );
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
            return { ...e, track: newSound, name: track.audioName, uuid: track.id, duration: status?.durationMillis, playing: true, artist: track.artist, artwork: track.artwork }
        });

        setMessages(e =>
            e.map((item) =>
                item._id === track.id ? { ...item, playing: false } : item
            )
        );

        // setPlayerStatus(() => {
        //     return { isPlaying: true, id: track.id }
        // });
    };

    const startPlayingByItem = async ({ item, isMessage }: { item: audioListType, isMessage?: boolean }) => {
        if (!item?.uri) return;
        // this is for if startPlayingByItem called from messaging open floatingMusicPlayer
        // if (isMessage&&item.audioName) setIsOpen(true);
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
        };

        setPlayer(() => {
            //@ts-ignore
            return { track: newSound, name: item.audioName, uri: item.uri, uuid: item.id, duration: status?.durationMillis, id: item.id, artist: item.artist, artwork: item.artwork, playing: true }
        });

        setMessages(e =>
            e.map((m) =>
                m._id === item.id ? { ...m, playing: true } : m
            )
        );
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
            return { track: newSound, name: forwardTrack.audioName, uri: forwardTrack.uri, uuid: forwardTrack.id, duration: status?.durationMillis, id: forwardTrack.id, artist: forwardTrack.artist, artwork: forwardTrack.artwork, playing: true }
        });

        setMessages(e =>
            e.map((item) =>
                item._id === forwardTrack.id ? { ...item, playing: true } : item
            )
        );
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
            return { track: newSound, name: forwardTrack.audioName, uri: forwardTrack.uri, uuid: forwardTrack.id, duration: status?.durationMillis, id: forwardTrack.id, artist: forwardTrack.artist, artwork: forwardTrack.artwork, playing: true }
        });

        setMessages(e =>
            e.map((item) =>
                item._id === forwardTrack.id ? { ...item, playing: true } : item
            )
        );
        // setPlayerStatus(()=>{
        //     return {isPlaying:true,id:forwardTrack.id}
        // });
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
            return { track: newSound, name: forwardTrack.audioName, uri: forwardTrack.uri, uuid: forwardTrack.id, duration: status?.durationMillis, id: forwardTrack.id, artist: forwardTrack.artist, artwork: forwardTrack.artwork, playing: true }
        });

        setMessages(e =>
            e.map((item) =>
                item._id === forwardTrack.id ? { ...item, playing: true } : item
            )
        );
        // setPlayerStatus(()=>{
        //     return {isPlaying:true,id:forwardTrack.id}
        // });
    };

    return { startPlaying, startPlayingByItem, startPlyingList, stopPlaying, shufflePlayList, playForward }
}

export default useAudioPlayer;