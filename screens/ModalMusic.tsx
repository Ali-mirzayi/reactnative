import { View, Text, StyleSheet, TouchableHighlight, FlatList, Pressable, TextInput } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { useCurrentContact, useLastTrack, usePlayer, usePosition } from '../socketContext';
import Slider from '@react-native-community/slider';
import { formatMillisecondsToTime } from '../utils/utils';
import { audioListType, useAudioList } from '../hooks/useAudioList';
import { Audio } from 'expo-av';
import Ionicons from "@expo/vector-icons/Ionicons";
import useTheme from '../utils/theme';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { storage } from '../mmkv';
import { repeatModeEnum } from '../utils/types';

const ModalMusic = () => {
  const { player, setPlayer } = usePlayer();
  const { lastTrack, setLastTrack } = useLastTrack();
  const { currentPosition, setCurrentPosition } = usePosition();
  const isPlaying = player?.playing;
  const { colors } = useTheme();
  const contact = useCurrentContact(state => state.contact);
  const navigation = useNavigation();
  const [openSearch, setOpenSearch] = useState(false);
  const [search, setSearch] = useState<audioListType[]>();
  const [repeatMode, setRepeatMode] = useState<repeatModeEnum | undefined>(storage.getNumber('repeatMode'));
  const searchInput = useRef<TextInput>(null);

  const AudioList = useAudioList();
  const filteredAudioList = AudioList.filter(audio => audio.audioName !== "voice");

  const currentTrack = AudioList.find(audio => audio.id === player?.id);

  const time = lastTrack?.duration ? formatMillisecondsToTime(lastTrack?.duration) : 'unknown';

  //@ts-ignore
  const currentPositionTime = (currentPosition?.position > 1) && (player?.id === currentPosition?.id) ? `${formatMillisecondsToTime(currentPosition.position)}` : 0;

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

  const handleSearch = (e: string) => {
    const res = filteredAudioList.filter(track => track.audioName.toLowerCase().includes(e.toLowerCase()));
    if (e === "" || e === undefined || res.length === 0) { setSearch(undefined) }
    setSearch(res);
    searchInput.current?.blur();
  }

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

  const playForward = async ({ indexJump }: { indexJump: 1 | -1 }) => {
    const currentTrackIndex = filteredAudioList.findIndex(audio => audio.id === player?.id);
    if (currentTrackIndex === -1) return;
    if(indexJump===-1 && Number(currentPosition.position)>=2000 ){
      player?.track?.playFromPositionAsync(0);
      return;
    }
    const forwardTrack = filteredAudioList.length === currentTrackIndex + indexJump ? filteredAudioList[0] : filteredAudioList[currentTrackIndex + indexJump];
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

  const renderTrackItem = ({ item }: { item: audioListType }) => {
    const isTrackPlaying = (item?.id === player?.id) ? player.playing : false;

    const playTrackItem = async () => {
      if (!item?.uri) return;
      setPlayer((e) => {
        return { ...e, uri: item?.uri, id: item?.id };
      });

      await stopPlaying({ isForStart: true });

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

    };

    return (
      <TouchableHighlight underlayColor={colors.undetlay} onPress={isTrackPlaying ? () => stopPlaying({ isForStart: false }) : playTrackItem} style={{ marginBottom: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={[styles.iconContainer, { backgroundColor: colors.card, width: 43, height: 43, paddingLeft: isTrackPlaying ? 0 : 2 }]}>
            <Ionicons name={isTrackPlaying ? "pause" : "play"} size={31} color={colors.text} />
          </View>
          <Text style={{ color: colors.text }}>{item.audioName}</Text>
        </View>
      </TouchableHighlight>
    )
  };

  const sliderValue = (currentPosition?.position && lastTrack?.duration) ? currentPosition?.position / lastTrack?.duration : 0;
  const onSlidingComplete = async (value: number) => {
    //@ts-ignore
    const pos = value * lastTrack.duration;
    setCurrentPosition(() => ({ position: pos, id: player?.id }));
    await player?.track?.setPositionAsync(pos);
  };

  const handleBack = () => {
    if (openSearch) {
      setOpenSearch(false);
      setSearch(undefined);
    } else {
      navigation.goBack();
    }
  };

  const getRepeatMode = (mode?: repeatModeEnum) => {
    switch (mode) {
      case repeatModeEnum.disabledRepeat:
        return <MaterialCommunityIcons name="repeat-off" size={26} color={colors.text} />;
      case repeatModeEnum.repeatTrack:
        return <MaterialCommunityIcons name="repeat-once" size={26} color={colors.text} />;
      case repeatModeEnum.repeatList:
        return <MaterialCommunityIcons name="shuffle-disabled" size={30} color={colors.text} />;
      case repeatModeEnum.suffleList:
        return <Ionicons name="shuffle" size={27} color={colors.text} />;
      default:
        return <MaterialCommunityIcons name="repeat-once" size={26} color={colors.text} />;
    }
  };

  const handlePressRepeatMode = () => {
    setRepeatMode(e => {
      if (e !== undefined && e !== repeatModeEnum.suffleList) {
        storage.set('repeatMode', e + 1);
        return e + 1
      } else {
        storage.set('repeatMode', 0);
        return 0
      }
    })
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ flexDirection: 'row', backgroundColor: colors.undetlay, height: 50, alignItems: 'center', justifyContent: "flex-start", paddingHorizontal: 20 }}>
        <Ionicons onPress={handleBack} name="arrow-back-outline" size={29} color={colors.text} />
        <TextInput placeholder='Search' ref={searchInput} cursorColor={colors.boarder} onChangeText={handleSearch} placeholderTextColor={colors.boarder} style={{ width: "87%", marginLeft: 12, fontSize: 20, color: colors.text, display: openSearch ? 'flex' : 'none' }} />
        {!openSearch &&
          <>
            <Text style={{ color: colors.text, fontSize: 23, fontWeight: '700', marginLeft: 12 }}>{contact?.name}</Text>
            <Ionicons onPress={() => {
              setOpenSearch(true);
              searchInput.current?.focus();
            }} name="search" size={30} style={{ marginLeft: "auto" }} color={colors.text} />
          </>
        }
      </View>
      <View style={{ marginTop: 'auto' }}>
        {search ?
          <FlatList
            data={search}
            renderItem={({ item }) => renderTrackItem({ item })}
            //@ts-ignore
            keyExtractor={search => search.id}
          />
          : <FlatList
            data={filteredAudioList}
            renderItem={({ item }) => renderTrackItem({ item })}
            //@ts-ignore
            keyExtractor={item => item.id}
          />
        }
      </View>
      <View style={[styles.controllerContainer, { backgroundColor: colors.undetlay }]}>
        <View style={styles.infoController}>
          <View style={{ marginRight: 'auto' }}>
            <Text style={{ color: colors.text }}>{lastTrack?.name}</Text>
            <Text style={{ color: colors.text }}>Artist</Text>
          </View>
          <View style={{ width: 35, height: 35, backgroundColor: '#000', marginLeft: 'auto' }}>
          </View>
        </View>
        <View>
          <View>
            <Slider
              style={{ height: 40 }}
              minimumValue={0}
              maximumValue={1}
              minimumTrackTintColor="#FFFFFF"
              maximumTrackTintColor="#000000"
              value={sliderValue}
              onSlidingComplete={onSlidingComplete}
              
            />
            <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginHorizontal:15}}>
              <Text style={{color:colors.text}}>{currentPositionTime}</Text>
              <Text style={{color:colors.text}}>{time}</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 5, alignItems: 'center', position: 'relative' }}>
            <Pressable onPress={handlePressRepeatMode} style={{ width: 50 }}>
              {getRepeatMode(repeatMode)}
            </Pressable>
            <Pressable onPress={() => playForward({ indexJump: -1 })} style={[styles.iconContainer, { backgroundColor: '' }]}>
              <Ionicons name={"play-skip-back"} size={26} color={colors.text} />
            </Pressable>
            <Pressable onPress={isPlaying ? () => stopPlaying({ isForStart: false }) : startPlaying} style={[styles.iconContainer, { backgroundColor: '', width: 50, height: 50 }]}>
              <Ionicons name={isPlaying ? "pause" : "play"} size={32} color={colors.text} />
            </Pressable>
            <Pressable onPress={() => playForward({ indexJump: 1 })} style={[styles.iconContainer, { backgroundColor: '' }]}>
              <Ionicons name={"play-skip-forward"} size={26} color={colors.text} />
            </Pressable>
            <View style={{ width: 50 }} />
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
    padding: 10,
    borderTopStartRadius: 12,
    borderTopEndRadius: 12,
    overflow: 'hidden'
  },
  infoController: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginHorizontal: 15
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