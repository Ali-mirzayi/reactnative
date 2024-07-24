import { View, Text, StyleSheet } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useSetSound } from '../socketContext';
// import { useTheme } from '@react-navigation/native';
import useTheme from '../utils/theme';
import * as FileSystem from 'expo-file-system';
import TrackPlayer, { Capability } from 'react-native-track-player';
import Ionicons from "@expo/vector-icons/Ionicons";


const FloatingMusicPlayer = () => {
    const [open, setOpen] = useState(false);
    const { sound, setSound } = useSetSound();
    const { colors } = useTheme();
    const [queueIndex, setQueueIndex] = useState<Number|undefined>(1);

    const handleClose = () => {
        setOpen(false);
    };

    async function playSound({ audio, duration, messageId }: {
        audio: string;
        messageId: string | number;
        duration: number | undefined;
        playing: boolean;
    }) {
        const queue = await TrackPlayer.getQueue();
        const track = queue.findIndex(item => item.id === messageId);
        // await TrackPlayer.add([{ url: audio, title: `title-${messageId}`, artist: `artist-${messageId}`, duration, id: messageId }]);
        
        if (track !== -1) {
            // If found, skip to that track and play  
            await TrackPlayer.stop();
            await TrackPlayer.skip(track);
            await TrackPlayer.play();
        } else {
            await TrackPlayer.stop();
            await TrackPlayer.add([{ url: audio, title: `title-${messageId}`, artist: `artist-${messageId}`, duration, id: messageId }]);
            await TrackPlayer.play();
        };
    };


    useEffect(() => {
        const playingAudio = sound.find(e => e.playing === true);
        if (!playingAudio?.audio) return;
        if (playingAudio) setOpen(true);
        // addTrackQueue();
        playSound(playingAudio);

        return track
            ? () => {
                console.log('Unloading Sound');
                track.unloadAsync();
            }
            : undefined;

    }, [sound, track]);

    if (open === true) {
        return (
            <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.primary }]}>
                <View style={styles.innerContainer}>
                    <Ionicons onPress={handleClose} name='close-circle' size={28} color={colors.red} style={styles.close} />
                    <Text>asd</Text>
                </View>
            </View>
        )
    }
}

export default FloatingMusicPlayer;

const styles = StyleSheet.create({
    container: {
        marginTop: -7,
        height: 40,
        borderRadius: 4,
        marginBottom: 8
    },
    // container: {
    //     width: '90%',
    //     height: 70,
    //     left: '5%',
    //     bottom: '14%',
    //     borderRadius: 8,
    //     position: 'absolute',
    //     borderWidth: 2.4
    // },
    innerContainer: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-around'
    },
    close: {
        // marginVertical: 15,
        marginLeft: 'auto',
        marginRight: 7
    }
});