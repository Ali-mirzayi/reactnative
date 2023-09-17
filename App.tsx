import "react-native-gesture-handler"
import { StyleSheet, Text } from 'react-native';
import { useAssets } from 'expo-asset';
import Navigation from "./Navigation";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { EventProvider } from 'react-native-outside-press';
import { useEffect } from "react";
import socket from "./utils/socket";

function App() {
  useEffect(() => {
    socket.connect();
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <EventProvider>
        <Navigation />
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