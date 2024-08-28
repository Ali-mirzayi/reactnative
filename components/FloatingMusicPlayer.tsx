import { View, Text, StyleSheet, TouchableOpacity, TouchableHighlight } from 'react-native';
import React, { useEffect, useRef } from 'react';
import { useIsOpen, useLastTrack, usePlayer, usePosition } from '../socketContext';
import useTheme from '../utils/theme';
import Ionicons from "@expo/vector-icons/Ionicons";
import { formatMillisecondsToTime } from '../utils/utils';
import { Audio, AVPlaybackStatusSuccess } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import { useAudioList } from '../hooks/useAudioList';
import { storage } from '../mmkv';
import { repeatModeEnum } from '../utils/types';

const FloatingMusicPlayer = () => {
    const { colors } = useTheme();
    const { player, setPlayer } = usePlayer();
    const { navigate } = useNavigation();
    const { lastTrack, setLastTrack } = useLastTrack();
    const setOpen = useIsOpen(state => state.setOpen);


    const { currentPosition, setCurrentPosition } = usePosition();

    const previousPositionRef = useRef<number | null>(null);

    const AudioList = useAudioList();
    const filteredAudioList = AudioList.filter(audio => audio.audioName !== "voice");

    const track = AudioList.find(audio => audio.id === player?.id);

    const stopPlaying = async ({ isForStart, isEnded }: { isForStart?: boolean, isEnded?: boolean }) => {
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
    };

    const startPlaying = async () => {
        if (!track?.uri) return;

        setLastTrack((e) => {
            return { ...e, uri: track?.uri, id: track?.id };
        });

        await stopPlaying({ isForStart: true });

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
    };

    const startPlyingList = async ({ indexJump, isShuffle }: { indexJump: number, isShuffle: boolean }) => {
        const currentTrackIndex = filteredAudioList.findIndex(audio => audio.id === player?.id);

        if (currentTrackIndex === -1) return;

        if (isShuffle) {
            let randomIndex;
            do {
                randomIndex = Math.floor(Math.random() * filteredAudioList.length + 1);
            } while (randomIndex === currentTrackIndex);
            const forwardTrack = filteredAudioList[randomIndex];
            setPlayer((e) => {
                return { ...e, uri: forwardTrack.uri, id: forwardTrack.id };
            });
            await stopPlaying({ isForStart: true });
            const { sound: newSound, status } = await Audio.Sound.createAsync(
                { uri: forwardTrack.uri },
                { isLooping: false, progressUpdateIntervalMillis: 1000, shouldPlay: true }
            );

            setCurrentPosition(() => ({ id: forwardTrack.id, position: undefined }));

            setPlayer(() => {
                //@ts-ignore
                return { track: newSound, name: forwardTrack.audioName, uri: forwardTrack.uri, uuid: forwardTrack.id, duration: status?.durationMillis, id: forwardTrack.id, playing: true }
            });

        } else {
            const forwardTrack = filteredAudioList.length === currentTrackIndex + indexJump ? filteredAudioList[0] : filteredAudioList[currentTrackIndex + indexJump];
            setPlayer((e) => {
                return { ...e, uri: forwardTrack.uri, id: forwardTrack.id };
            });

            await stopPlaying({ isForStart: true });

            const { sound: newSound, status } = await Audio.Sound.createAsync(
                { uri: forwardTrack.uri },
                { isLooping: false, progressUpdateIntervalMillis: 1000, shouldPlay: true }
            );

            setCurrentPosition(() => ({ id: forwardTrack.id, position: undefined }));

            setPlayer(() => {
                //@ts-ignore
                return { track: newSound, name: forwardTrack.audioName, uri: forwardTrack.uri, uuid: forwardTrack.id, duration: status?.durationMillis, id: forwardTrack.id, playing: true }
            });
        }

    };

    const onPlaybackStatusUpdate = (status: AVPlaybackStatusSuccess) => {
        const currentPosition = status.positionMillis;
        if (!currentPosition) return;
        if (status.isPlaying === true) {
            if (previousPositionRef.current === null || currentPosition !== previousPositionRef.current) {
                setCurrentPosition(() => ({ id: player?.uuid, position: currentPosition }));
                previousPositionRef.current = currentPosition;
            }
        }

        if (status.didJustFinish) {
            switch (storage.getNumber('repeatMode')) {
                case repeatModeEnum.disabledRepeat:
                    setCurrentPosition(() => ({ id: player?.uuid, position: undefined }));
                    stopPlaying({ isEnded: true });
                    break;
                case repeatModeEnum.repeatTrack:
                    player?.track?.replayAsync();
                    break;
                case repeatModeEnum.repeatList:
                    startPlyingList({ indexJump: 1, isShuffle: false })
                    break;
                case repeatModeEnum.suffleList:
                    startPlyingList({ indexJump: 1, isShuffle: true })
                    break;
                default:
                    setCurrentPosition(() => ({ id: player?.uuid, position: undefined }));
                    stopPlaying({ isEnded: true });
                    break;
            }
        };
    };

    const handleClose = async () => {
        await stopPlaying({});
        setOpen(false);
    };

    useEffect(() => {
        if (!player?.playing) return;
        setOpen(true);
        if (player?.track) {
            // @ts-ignore
            player.track.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
        }
        setLastTrack((e) => {
            //@ts-ignore
            return { ...e, name: player?.name, id: player?.id, duration: player?.duration };
        });
    }, [player?.uuid]);

    const time = lastTrack.duration ? formatMillisecondsToTime(lastTrack.duration) : 'unknown';
    const currentPositionTime = currentPosition.position ? formatMillisecondsToTime(currentPosition.position) : time;

    return (
        //@ts-ignore
        <TouchableOpacity onPress={() => navigate('ModalMusic')} style={[styles.container, { backgroundColor: colors.card, borderColor: colors.primary }]}>
            <View style={styles.innerContainer}>
                <View style={styles.close}>
                    <Text style={{ color: colors.text }}>{currentPositionTime}</Text>
                    <Ionicons onPress={handleClose} name='close-circle' size={28} color={colors.red} />
                </View>
                <Text style={{ color: colors.text }}>{lastTrack.name}</Text>
                <TouchableHighlight onPress={player?.playing ? () => stopPlaying({}) : startPlaying} style={[styles.iconContainer, { backgroundColor: colors.undetlay }]}>
                    <Ionicons name={player?.playing ? "pause" : "play"} size={20} color="#fff" style={{ marginLeft: player?.playing ? 0 : 2 }} />
                </TouchableHighlight>
            </View>
        </TouchableOpacity>
    );
}

export default FloatingMusicPlayer;

const styles = StyleSheet.create({
    container: {
        marginTop: -2,
        height: 40,
        borderRadius: 4,
        marginBottom: 8,
    },
    iconContainer: {
        width: 30,
        backgroundColor: '#000',
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 50,
        marginHorizontal: 10
    },
    innerContainer: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: '100%'
    },
    close: {
        marginLeft: 'auto',
        marginRight: 7,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    }
});