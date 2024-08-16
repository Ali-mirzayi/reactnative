import { View, Text, StyleSheet, TouchableHighlight, FlatList, Pressable } from 'react-native'
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
  const filteredAudioList = AudioList.filter(audio=>audio.audioName!=="voice");

  const currentTrack = AudioList.find(audio => audio.id === player?.id);

  const stopPlaying = async ({ isForStart }: { isForStart: boolean }) => {
    if (!player?.track) return;
    const status = await player.track.getStatusAsync();
    await player.track.stopAsync();
    await player.track.unloadAsync();
    // @ts-ignore 
    const lastPosition = status.positionMillis;

    setPlayer((e) => {
      return { uri: undefined, track: undefined, name: undefined, id: e?.id, duration: undefined, lastPosition, playing: isForStart ? true : false };
    });
    setCurrentPosition((e) => ({ id: e.id, position: lastPosition }));
  };

  const startPlaying = async () => {
    if (!currentTrack?.uri) return;

    setPlayer((e) => {
      return { ...e, uri: currentTrack.uri, id: currentTrack?.id };
    });

    await stopPlaying({ isForStart: true });

    const { sound: newSound, status } = await Audio.Sound.createAsync(
      { uri: currentTrack.uri },
      { isLooping: false, progressUpdateIntervalMillis: 1000, shouldPlay: false }
    );

    if (currentPosition.id === currentTrack.id && currentPosition.position) {
      await newSound.playFromPositionAsync(currentPosition.position);
    } else {
      await newSound.playAsync();
      setCurrentPosition(() => ({ id: currentTrack.id, position: undefined }));
    }

    setPlayer(() => {
      //@ts-ignore
      return { track: newSound, name: currentTrack.audioName, uri: currentTrack.uri, uuid: currentTrack.id, duration: status?.durationMillis, id: currentTrack.id, playing: true }
    });
  };

  const playForward = async () => {
    const currentTrackIndex = filteredAudioList.findIndex(audio => audio.id === player?.id);
    console.log(currentTrackIndex,'currentTrackIndex')
    if (currentTrackIndex===-1) return;
    const forwardTrack = filteredAudioList.length === currentTrackIndex+1 ? filteredAudioList[0] : filteredAudioList[currentTrackIndex+1];
    console.log(filteredAudioList.length,'forwardTrack')
    setPlayer((e) => {
      return { ...e, uri: forwardTrack.uri, id: forwardTrack.id };
    });

    await stopPlaying({ isForStart: true });

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

  const time = lastTrack?.duration ? formatMillisecondsToTime(lastTrack?.duration) : 'unknown';

  //@ts-ignore
  // const currentPositionTime = (currentPosition?.position > 1) && (player?.id === currentPosition?.id) ? `${formatMillisecondsToTime(currentPosition.position)} / ${time}` : time;

  const sliderValue = (currentPosition?.position && lastTrack?.duration) ? currentPosition?.position / lastTrack?.duration : 0;
  const onSlidingComplete = async (value: number) => {
    //@ts-ignore
    const pos = value * player.duration;
    setCurrentPosition(() => ({ position: pos, id: player?.id }));
    await player?.track?.setPositionAsync(pos);
  }


  return (
    <View style={styles.container}>
      <View style={{marginTop:'auto'}}>
        <FlatList
          data={filteredAudioList}
          renderItem={({ item }) => <Text>{item.audioName}</Text>}
          //@ts-ignore
          keyExtractor={item => item.id}
        />
      </View>
      <View style={[styles.controllerContainer,{backgroundColor:colors.background}]}>
        <View style={styles.infoController}>
          <View style={{ marginRight: 'auto' }}>
            <Text style={{color:colors.text}}>{lastTrack?.name}</Text>
            <Text style={{color:colors.text}}>Artist</Text>
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
          <View style={{flexDirection:"row",justifyContent:"center",gap:5,alignItems:'center'}}>
            <Pressable style={[styles.iconContainer,{backgroundColor:''}]}>
              <Ionicons name={"play-skip-back"} size={26} color="#fff" />
            </Pressable>
            <Pressable onPress={isPlaying ? () => stopPlaying({ isForStart: false }) : startPlaying} style={[styles.iconContainer, { backgroundColor: colors.background,width:50,height:50 }]}>
              <Ionicons name={isPlaying ? "pause" : "play"} size={32} color="#fff" />
            </Pressable>
            <Pressable onPress={playForward} style={[styles.iconContainer,{backgroundColor:''}]}>
              <Ionicons name={"play-skip-forward"} size={26} color="#fff" />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  )
}

export default ModalMusic;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  controllerContainer: {
    height: 150,
    padding: 0
  },
  infoController: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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