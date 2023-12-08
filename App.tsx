import "react-native-gesture-handler"
import { StyleSheet, Text, View, StatusBar } from 'react-native';
import { useAssets } from 'expo-asset';
import Navigation from "./Navigation";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { EventProvider } from 'react-native-outside-press';
import Context from "./socketContext";
import { useEffect, useState } from "react";
// import { createTable, deleteRooms } from "./utils/DB";
// import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNetInfo } from "@react-native-community/netinfo";
import Toast, { ErrorToast } from 'react-native-toast-message';
import baseURL from "./utils/baseURL";

function App() {
  const netInfo = useNetInfo({ reachabilityUrl: `${baseURL()}/checkUser` });
  const [error,setError] = useState(false);
  useEffect(() => {
    // check internet connectiont
    if (netInfo.isConnected === false) {
      const showToast = () => {
        Toast.show({
          type: 'error',
          text1: 'you are offline',
          autoHide: false
        });
        setError(true);
      }
      showToast();
    } else {
      // check server conection
      const timeout = new Promise((_, reject) => {
        setTimeout(reject, 7000, 'Request timed out');
      });
      const request = fetch(baseURL());
      Promise.race([timeout, request]).then(()=>setError(false)).catch(() => {
        Toast.show({
          type: 'error',
          text1: 'Connection error',
          text2: 'An error occurred while trying to connect the server',
          autoHide: false
        });
        setError(true);
      })
    }
  }, [netInfo.isConnected]);

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
        <Context>
          <View style={{ zIndex: 9999 }}>
            <Toast config={toastConfig} />
          </View>
          <StatusBar hidden={error ? false : true} backgroundColor={'red'} />
          <Navigation />
        </Context>
      </EventProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

function Main() {
  const [assets] = useAssets([
    require('./assets/chat.png'),
    require('./assets/icon-square.png'),
    require('./assets/user.png'),
    require('./assets/welcome.png'),
    require('./assets/mirza64.png'),
    require('./assets/mirza96.png'),
    require('./assets/mirza128.png'),
    require('./assets/mirza256.png')]
  );

  if (!assets) {
    return <Text>loading...</Text>
  }
  return <App />
}

export default Main;