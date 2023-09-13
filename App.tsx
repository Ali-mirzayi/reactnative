import "react-native-gesture-handler"
import { StyleSheet, Text, View } from 'react-native';
import { useAssets } from 'expo-asset';
import Navigation from "./Navigation";
import { useLayoutEffect, useState } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';

function App() {
  const [user, setUser] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
    const getUsername = async () => {
      try {
        setLoading(true);
        const value = await AsyncStorage.getItem("username");
        if (value !== null) {
          setUser(value)
        }
        setLoading(false);
      } catch (e) {
        console.error("Error while loading username!");
        setLoading(false);
      }
    };
    getUsername();
  }, []);

  return (<>
    {
      loading ?
        <View style={{flex:1,justifyContent:"center",alignItems:"center"}}><Text>Wait ...</Text></View >
        :
        <Navigation user={user}/>
    }
  </>);
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