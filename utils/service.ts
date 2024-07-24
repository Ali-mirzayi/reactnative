import TrackPlayer, { Event } from 'react-native-track-player';

export const PlaybackService = async function () {
    try {
        TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
        TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
        // TrackPlayer.addEventListener(Event.RemoteSkip, () => TrackPlayer.skip());
        TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext());
        TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious());
        TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.stop());
    }catch(err){
        console.log(err,'error registering TrackPlayer')
    }
};