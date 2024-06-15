import "react-native-gesture-handler"
import { StyleSheet, Text, View, StatusBar, useColorScheme } from 'react-native';
import { useAssets } from 'expo-asset';
import Navigation from "./Navigation";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { EventProvider } from 'react-native-outside-press';
import { useSocket } from "./socketContext";
import { useCallback, useEffect, useState } from "react";
import Toast, { ErrorToast } from 'react-native-toast-message';
import baseURL from "./utils/baseURL";
import checkConnection from "./utils/checkConnection";
import LoadingPage from "./components/LoadingPage";
import io from 'socket.io-client';
import sleep from "./utils/wait";
import { useFocusEffect } from "@react-navigation/native";
import { ensureDirExists } from "./utils/directories";

function App() {
  const [error, setError] = useState(false);
  const setSocket = useSocket(state => state.setSocket);

  checkConnection(setError);

  async function isDirExists() {
    await ensureDirExists();
  }


  useEffect(() => {
    // Connect to the Socket.IO server
    const newSocket = io(baseURL());
    setSocket(newSocket);
    isDirExists();
    // const aa = async() => {
    //   await sleep(5000);
    //   console.log(newSocket?.id,'socket?.id')
    // }; 
    // aa();
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
  }
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