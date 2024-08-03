import { View, Text } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { usePlayer, usePosition } from '../socketContext';
import { AVPlaybackStatusSuccess } from 'expo-av';
import { formatMillisecondsToTime } from '../utils/utils';
import { useAudioList } from '../hooks/useAudioList';

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
  const [lastTrack, setLastTrack] = useState<lastTrack>(initialLastTrack);
  // const previousPositionRef = useRef<number | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const currentPosition = usePosition(state=>state.currentPosition);

  const AudioList = useAudioList();

  const track = AudioList.find(audio => audio.id === player?.id);

  // setLastTrack

  // console.log(track,'tttttrack');

  const stopPlaying = async () => {
    if (!player?.track) return;
    await player.track.stopAsync();
    await player.track.unloadAsync();

    setPlayer((e) => {
      return { uri: undefined, track: undefined, name: undefined, id: e?.id, duration: undefined, lastPosition: undefined, playing: false };
    });
  };

  useEffect(() => {
    console.log(currentPosition);
  },[currentPosition])


  // const onPlaybackStatusUpdate = (status: AVPlaybackStatusSuccess) => {
  //   if (!status?.playableDurationMillis) return;
  //   const currentPosition = status.positionMillis;

  //   if (previousPositionRef.current === null || currentPosition !== previousPositionRef.current) {
  //     console.log('first')
  //     const progress = Math.floor(currentPosition / status.playableDurationMillis * 100);
  //     setProgress(progress);
  //     previousPositionRef.current = currentPosition;
  //   }

  //   if (status.didJustFinish) {
  //     stopPlaying();
  //   };
  // };


  useEffect(() => {
    if (!player?.playing) return;
    setLastTrack((e) => {
      //@ts-ignore
      return { ...e, name: player?.name, id: player?.id, duration: player?.duration };
    });
    if (player?.track) {
      // (async () => {
        //@ts-ignore
        //  player.track.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
      // })();
    }
  }, [player?.uuid]);

  const time = lastTrack.duration ? formatMillisecondsToTime(Math.floor((lastTrack.duration / 1000))) : 'unknown';

  return (
    <View>
      <Text>{time}</Text>
      <Text>{track?.audioName}</Text>
      <Text style={{ marginHorizontal: 20 }}>{progress} %</Text>
    </View>
  )
}

export default ModalMusic;