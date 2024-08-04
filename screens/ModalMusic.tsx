import { View, Text, StyleSheet, TouchableHighlight, FlatList } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { useLastTrack, usePlayer, usePosition } from '../socketContext';
import Slider from '@react-native-community/slider';
import { formatMillisecondsToTime } from '../utils/utils';
import { useAudioList } from '../hooks/useAudioList';
import { Audio } from 'expo-av';
import Ionicons from "@expo/vector-icons/Ionicons";
import useTheme from '../utils/theme';

type lastTrack = {
  duration?: number,
  name?: string,
  id?: number | string,
  uri?: string
};

const initialLastTrack: lastTrack = {
  duration: undefined,
  id: undefined,
  name: undefined,
  uri: undefined
};

type progress = {
  position?: number,
  duration?: number,
  id?: number | string,
};

const initialProgress: progress = {
  duration: undefined,
  position: undefined,
  id: undefined,
};

const ModalMusic = () => {
  const { player, setPlayer } = usePlayer();
  const { lastTrack, setLastTrack } = useLastTrack();
  const { currentPosition, setCurrentPosition } = usePosition();
  const isPlaying = player?.playing;
  const { colors } = useTheme();

  const AudioList = useAudioList();

  console.log(AudioList)

  const track = AudioList.find(audio => audio.id === player?.id);

  const stopPlaying = async ({ isForStart }: { isForStart: boolean }) => {
    if (!player?.track) return;
    const status = await player.track.getStatusAsync();
    await player.track.stopAsync();
    await player.track.unloadAsync();
    // @ts-ignore 
    const lastPosition = status.positionMillis;

    setPlayer((e) => {
      //@ts-ignore
      return { uri: undefined, track: undefined, name: undefined, id: e?.id, duration: undefined, lastPosition, playing: isForStart ? true : false };
    });
    setCurrentPosition((e) => ({ id: e.id, position: lastPosition }));
  };

  const startPlaying = async () => {
    if (!track?.uri) return;

    setPlayer((e) => {
      return { ...e, uri: track.uri, id: track?.id };
    });

    await stopPlaying({ isForStart: true });

    const { sound: newSound, status } = await Audio.Sound.createAsync(
      { uri: track.uri },
      { isLooping: false, progressUpdateIntervalMillis: 1000, shouldPlay: false }
    );

    if (currentPosition.id === track.id && currentPosition.position) {
      await newSound.playFromPositionAsync(currentPosition.position);
    } else {
      await newSound.playAsync();
      setCurrentPosition(() => ({ id: track.id, position: undefined }));
    }

    setPlayer(() => {
      //@ts-ignore
      return { track: newSound, name: track.audioName, uri: track.uri, uuid: track.id, duration: status?.durationMillis, id: track.id, playing: true }
    });
  };

  useEffect(() => {
    if (!player?.playing) return;
    setLastTrack((e) => {
      //@ts-ignore
      return { ...e, name: player?.name, id: player?.id, duration: player?.duration };
    });
    if (player?.track) {
    }
  }, [player?.uuid]);

  const time = lastTrack?.duration ? formatMillisecondsToTime(Math.floor(lastTrack?.duration / 1000)) : 'unknown';

  //@ts-ignore
  const currentPositionTime = (currentPosition?.position > 1) && (player?.id === currentPosition?.id) ? `${formatMillisecondsToTime(Math.floor((currentPosition.position / 1000)))} / ${time}` : time;

  {/* <Text>{time}</Text> */ }
  {/* <Text>{track?.audioName}</Text> */ }
  {/* <Text style={{ marginHorizontal: 20 }}>{currentPositionTime}</Text> */ }
  const sliderValue = (currentPosition?.position && lastTrack?.duration) ? currentPosition?.position / lastTrack?.duration : 0;
  const onSlidingComplete = async (value: number) => {
    //@ts-ignore
    const pos = value * player.duration;
    setCurrentPosition(() => ({ position: pos, id: player?.id }));
    await player?.track?.setPositionAsync(pos);

    // }
  }

  return (
    <View style={styles.container}>
      <View style={{marginTop:'auto'}}>
        <FlatList
          data={AudioList}
          renderItem={({ item }) => <Text>{item.audioName}</Text>}
          //@ts-ignore
          keyExtractor={item => item.id}
        />
      </View>
      <View style={styles.controllerContainer}>
        <View style={styles.infoController}>
          <View style={{ marginRight: 'auto' }}>
            <Text>{lastTrack?.name}</Text>
            <Text>Artist</Text>
          </View>
          <View style={{ width: 30, height: 30, backgroundColor: '#000', marginLeft: 'auto' }}>
          </View>
        </View>
        <View style={{}}>
          <Slider
            style={{ width: 'auto', height: 40}}
            minimumValue={0}
            maximumValue={1}
            minimumTrackTintColor="#FFFFFF"
            maximumTrackTintColor="#000000"
            value={sliderValue}
            onSlidingComplete={onSlidingComplete}
          />
          <View>
            <TouchableHighlight onPress={isPlaying ? () => stopPlaying({ isForStart: false }) : startPlaying} style={[styles.iconContainer, { backgroundColor: colors.undetlay }]}>
              <Ionicons name={isPlaying ? "pause" : "play"} size={30} color="#fff" style={{ marginLeft: isPlaying ? 0 : 2 }} />
            </TouchableHighlight>
          </View>
        </View>
      </View>
    </View>
  )
}

export default ModalMusic;

const styles = StyleSheet.create({
  container: {
    // flexDirection: 'column-reverse',
    flex: 1,
  },
  controllerContainer: {
    backgroundColor: 'red',
    height: 150,
    padding: 0
  },
  infoController: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    // paddingTop:15,
    alignItems: 'center'
  },
  iconContainer: {
    width: 40,
    backgroundColor: '#000',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
    marginHorizontal: 10
  },
});