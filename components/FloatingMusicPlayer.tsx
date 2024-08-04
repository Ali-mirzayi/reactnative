import { View, Text, StyleSheet, TouchableOpacity, TouchableHighlight } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { useIsOpen, useLastTrack, usePlayer, usePosition } from '../socketContext';
import useTheme from '../utils/theme';
import Ionicons from "@expo/vector-icons/Ionicons";
import { formatMillisecondsToTime } from '../utils/utils';
import { Audio, AVPlaybackStatusSuccess } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import { useAudioList } from '../hooks/useAudioList';

const FloatingMusicPlayer = () => {
    // const [open, setOpen] = useState(false);
    const { colors } = useTheme();
    const { player, setPlayer } = usePlayer();
    const { navigate } = useNavigation();
    const { lastTrack, setLastTrack } = useLastTrack();
    const setOpen = useIsOpen(state=>state.setOpen);

    const { currentPosition, setCurrentPosition } = usePosition();

    const previousPositionRef = useRef<number | null>(null);

    const AudioList = useAudioList();

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
        // console.log('0001');
        if (!track?.uri) return;

        setLastTrack((e) => {
            return { ...e, uri: track?.uri, id: track?.id };
        });

        await stopPlaying({ isForStart: true });
        // console.log('0003');

        const { sound: newSound, status } = await Audio.Sound.createAsync(
            { uri: track.uri },
            { isLooping: false, progressUpdateIntervalMillis: 1000, shouldPlay: false }
        );

        // console.log('0004');
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
            setCurrentPosition(() => ({ id: player?.uuid, position: undefined }));
            stopPlaying({ isEnded: true });
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

    const time = lastTrack.duration ? formatMillisecondsToTime(Math.floor((lastTrack.duration / 1000))) : 'unknown';
    const currentPositionTime = currentPosition.position ? formatMillisecondsToTime(Math.floor((currentPosition.position / 1000))) : time;

    // if (open === true) {
        return (
            //@ts-ignore
            <TouchableOpacity onPress={() => navigate('ModalMusic')} style={[styles.container, { backgroundColor: colors.card, borderColor: colors.primary }]}>
                <View style={styles.innerContainer}>
                    <View style={styles.close}>
                        <Text>{currentPositionTime}</Text>
                        <Ionicons onPress={handleClose} name='close-circle' size={28} color={colors.red} />
                    </View>
                    <Text>{lastTrack.name}</Text>
                    <TouchableHighlight onPress={player?.playing ? () => stopPlaying({}) : startPlaying} style={[styles.iconContainer, { backgroundColor: colors.undetlay }]}>
                        <Ionicons name={player?.playing ? "pause" : "play"} size={20} color="#fff" style={{ marginLeft: player?.playing ? 0 : 2 }} />
                    </TouchableHighlight>
                </View>
            </TouchableOpacity>
        );
    }
// };

export default FloatingMusicPlayer;

// const styles = StyleSheet.create({
// 	sendIcon: {
// 		marginBottom: 6,
// 		marginRight: 8,
// 		height: "auto"
// 	},
// 	footerChatOpen: {
// 		shadowColor: '#1F2687',
// 		shadowOpacity: 0.37,
// 		shadowRadius: 8,
// 		shadowOffset: { width: 0, height: 8 },
// 		elevation: 8,
// 		borderTopLeftRadius: 10,
// 		borderTopRightRadius: 10,
// 		borderWidth: 1,
// 		borderColor: 'rgba(255, 255, 255, 0.18)',
// 		flexDirection: 'row',
// 		justifyContent: 'space-around',
// 		paddingHorizontal: 10,
// 		paddingTop: 15,
// 		backgroundColor: '#fff',
// 		height: 380,
// 		position: 'absolute',
// 		bottom: 0,
// 		right: 0,
// 		left: 0,
// 	},
// 	iconContainer: {
// 		width: 50,
// 		height: 50,
// 		justifyContent: 'center',
// 		alignItems: 'center',
// 		borderRadius: 50,
// 	},
// 	image: {
// 		width: 150,
// 		height: 100,
// 		borderRadius: 13,
// 		margin: 3,
// 		resizeMode: 'cover',
// 	},
// 	imageActive: {
// 		flex: 1,
// 		resizeMode: 'contain',
// 	},
// 	download: {
// 		position: 'absolute',
// 		left: 55,
// 		top: 30,
// 		zIndex: 50
// 	}
// });


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