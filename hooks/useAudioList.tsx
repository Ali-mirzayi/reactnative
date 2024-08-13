import { useEffect, useState } from 'react'
import { Room } from '../utils/types';
import { getAllRooms } from '../utils/DB';

type audioListType = {
  uri: string;
  audioName: string;
  id: string | number;
};

export const useAudioList = () => {
  const [audioList,setAudioList] = useState<audioListType[]>([]); 
  useEffect(() => {
    getAllRooms().then((result: Room[] | any) => {
      if (result.length > 0) {
        const messages: audioListType[] = [];
        const rooms: Room[] = result.map((e: any) => JSON.parse(e.data));
        rooms.forEach(room => {
          room.messages.forEach(message => {
            if (message.audio) {
              messages.push({ uri: message.audio, audioName: message.fileName ?? "unknown", id: message._id });
            }
          })
        });

        setAudioList(messages);
      }
    }).catch((e) => console.log(e))
  }, []);
  return audioList;
};


// export const useSetupPlayer = ():boolean => {
//   const [playerReady, setPlayerReady] = useState<boolean>(false);

//   useEffect(() => {
//     let unmounted = false;
//     (async () => {
//       await SetupService();
//       if (unmounted) return;
//       setPlayerReady(true);
//     })();
//     return () => {
//       unmounted = true;
//     };
//   }, []);
//   return playerReady;
// }