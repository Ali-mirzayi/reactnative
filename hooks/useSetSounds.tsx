import { useEffect } from 'react'
import { useSetSound } from "../socketContext";
import { Room } from '../utils/types';
import { getAllRooms } from '../utils/DB';
import Toast from 'react-native-toast-message';
import TrackPlayer from 'react-native-track-player';

export default function useSetSounds() {
  const { sound, setSound } = useSetSound();

  type soundItemType = {
    audio: string;
    messageId: string | number;
    duration: number | undefined,
    playing: boolean;
  }

  useEffect(() => {

    (async () => {
      await TrackPlayer.setupPlayer();
    })();

    getAllRooms().then((result: Room[] | any) => {
      if (result.length > 0) {
        const messages: soundItemType[] = [];
        const rooms: Room[] = result.map((e: any) => JSON.parse(e.data));
        rooms.forEach(room => {
          room.messages.forEach(message => {
            if (message.audio) {
              messages.push({ audio: message.audio, messageId: message._id, duration: message.duration, playing: false });
              // messages.push({ audio: message.audio, messageId: message._id, playing: false });
            }
          })
        });
        
        const tracks = messages.map(e => ({
          url: e.audio,
          artist: `artist-${e.messageId}`,
          title: `title-${e.messageId}`,
          duration: e.duration, 
          id: e.messageId,
        }));

        console.log(tracks);
        
        (async () => {
          await TrackPlayer.add(tracks);
        })();

        setSound(() => {
          return messages
        });
      }
    }).catch((e) => console.log(e))
    // Toast.show({
    //   type: 'error',
    //   text1: 'some thing went wrong with db',
    //   autoHide: false
    // }));
  }, []);

  return sound;
}
