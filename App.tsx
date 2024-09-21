import "react-native-gesture-handler"
import { StatusBar, I18nManager } from 'react-native';
import { useAssets } from 'expo-asset';
import Navigation from "./Navigation";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { EventProvider } from 'react-native-outside-press';
import { useSocket } from "./socketContext";
import { useEffect, useState } from "react";
import Toast, { ErrorToast } from 'react-native-toast-message';
import baseURL from "./utils/baseURL";
import useCheckConnection from "./utils/checkConnection";
import LoadingPage from "./components/LoadingPage";
import io from 'socket.io-client';
import * as Updates from 'expo-updates';

function App() {
  const [error, setError] = useState(false);
  const setSocket = useSocket(state => state.setSocket);

  I18nManager.forceRTL(false);
  I18nManager.allowRTL(false);

  useCheckConnection(setError);

  // async function onFetchUpdateAsync() {
  //   try {
  //     const update = await Updates.checkForUpdateAsync();
  //     if (update.isAvailable) {
  //       Toast.show({
  //         type: 'info',
  //         text1: 'Download New Version Mirzagram ;)',
  //         autoHide: false
  //       });
  //       await Updates.fetchUpdateAsync();
  //     }
  //   } catch (error) {
  //     Toast.show({
  //       type: 'error',
  //       text1: 'Error fetching latest Expo update',
  //       autoHide: false,
  //     });
  //     console.log(`Error fetching latest Expo update: ${error}`);
  //   }
  // }

  useEffect(() => {
    // Connect to the Socket.IO server
    const newSocket = io(baseURL());
    setSocket(newSocket);
    // onFetchUpdateAsync();

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const toastConfig = {
    error: (props: any) => (
      <ErrorToast
        {...props}
        text1Style={{
          fontSize: 17
        }}
        text2Style={{
          fontSize: 15
        }}
      />
    )
  };

  // if (!isSetup) { return (<LoadingPage active/>) }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <EventProvider>
        <StatusBar hidden={error ? false : true} backgroundColor={'red'} />
        <Navigation />
        <Toast config={toastConfig} />
      </EventProvider>
    </GestureHandlerRootView>
  );
}

function Main() {
  const [assets] = useAssets([
    require('./assets/mirza64.png'),
    require('./assets/mirza96.png'),
    require('./assets/mirza128.png'),
    require('./assets/mirza256.png')]
  );

  if (!assets) {
    return <LoadingPage active={true} />
  }
  return <App />
}

export default Main;