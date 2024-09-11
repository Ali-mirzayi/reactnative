import { View, Text, StyleSheet, TouchableOpacity, TouchableHighlight } from 'react-native';
import React, { useEffect, useRef } from 'react';
import { useIsOpen, useLastTrack, usePlayer, usePosition } from '../socketContext';
import useTheme from '../utils/theme';
import Ionicons from "@expo/vector-icons/Ionicons";
import { formatMillisecondsToTime } from '../utils/utils';
import { AVPlaybackStatusSuccess } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import { storage } from '../mmkv';
import { repeatModeEnum } from '../utils/types';
import MovingText from './MovingText';
import useAudioPlayer from '../hooks/useAudioPlayer';

const FloatingMusicPlayer = () => {
    const { colors } = useTheme();
    const player = usePlayer(state=>state.player);
    const { navigate } = useNavigation();
    const { lastTrack, setLastTrack } = useLastTrack();
    const setOpen = useIsOpen(state => state.setOpen);
    
    const { currentPosition, setCurrentPosition } = usePosition();
    const { startPlaying , startPlyingList, stopPlaying, shufflePlayList } = useAudioPlayer();
    
    const previousPositionRef = useRef<number | null>(null);
    
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
                    stopPlaying({ isEnded: true, isForStart: false });
                    break;
                case repeatModeEnum.repeatTrack:
                    player?.track?.replayAsync();
                    break;
                case repeatModeEnum.repeatList:
                    startPlyingList({ indexJump: 1 });
                    break;
                case repeatModeEnum.suffleList:
                    shufflePlayList();
                    break;
                default:
                    setCurrentPosition(() => ({ id: player?.uuid, position: undefined }));
                    stopPlaying({ isEnded: true, isForStart: false });
                    break;
            }
        };
    };

    const handleClose = async () => {
        await stopPlaying({ isEnded: false, isForStart: false });
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

    const currentPositionTime = currentPosition.position ? formatMillisecondsToTime(currentPosition.position) : '00:00';

    return (
        //@ts-ignore
        <TouchableOpacity onPress={() => navigate('ModalMusic')} style={[styles.container, { backgroundColor: colors.card, borderColor: colors.primary }]}>
            <View style={styles.innerContainer}>
                <TouchableHighlight onPress={player?.playing ? () => stopPlaying({ isEnded: false, isForStart: false }) : startPlaying} style={[styles.iconContainer, { backgroundColor: colors.undetlay }]}>
                    <Ionicons name={player?.playing ? "pause" : "play"} size={20} color="#fff" style={{ marginLeft: player?.playing ? 0 : 2 }} />
                </TouchableHighlight>
                <View style={styles.containerMovingText}>
                    <MovingText animationThreshold={35} style={{ color: colors.text, size: 10, paddingLeft: 0,marginRight:0,paddingRight:0 }} disable={!player?.playing && Number(lastTrack?.name?.length) >= 50}>{lastTrack.name ?? ""}</MovingText>
                </View>
                <View style={styles.close}>
                    <Text style={{ color: colors.text }}>{currentPositionTime}</Text>
                    <Ionicons onPress={handleClose} name='close-circle' size={28} color={colors.red} />
                </View>
            </View>
        </TouchableOpacity>
    );
}

export default FloatingMusicPlayer;

const styles = StyleSheet.create({
    container: {
        height: 40,
        borderRadius: 4,
    },
    innerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: '100%',
        width: 'auto',
        justifyContent: 'flex-start',
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
    containerMovingText: {
        overflow: 'hidden',
        flex: 1,
       paddingHorizontal:5
    },
    close: {
        marginHorizontal: 7,
        width: 70,
        flexDirection: 'row',
        alignItems: 'center',
        height: 30,
        gap: 10,
    }
});