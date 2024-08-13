import { registerRootComponent } from 'expo';
import TrackPlayer from 'react-native-track-player';
import App from './App';
import { PlaybackService } from './utils/service';


registerRootComponent(App);

TrackPlayer.registerPlaybackService(() => PlaybackService);