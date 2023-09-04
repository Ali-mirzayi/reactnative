import { useEffect, useLayoutEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAssets } from 'expo-asset';
// import SocketIOClient from 'socket.io-client';
import Login from "./screens/Login";
// import Messaging from "./screens/Messaging";
import Chat from "./screens/Chat";

function App() {
  const Stack = createStackNavigator();

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name='Login'
          component={Login}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name='Chat'
          component={Chat}
          options={{
            title: "Chats",
            headerShown: false,
          }}
        />
        {/* <Stack.Screen name='Messaging' component={Messaging} /> */}
      </Stack.Navigator>
    </NavigationContainer>
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
  const [assets] = useAssets(
    require('./assets/chat.png'),
    require('./assets/icon-square.png'),
    require('./assets/user.png'),
    require('./assets/welcome.png'),
  );
  if (!assets) {
    return <Text>loading...</Text>
  }
  return <App />
}

export default Main;