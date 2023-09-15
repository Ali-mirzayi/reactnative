import "react-native-gesture-handler"
import { StyleSheet, Text, View } from 'react-native';
import { useAssets } from 'expo-asset';
import Navigation from "./Navigation";
import { useLayoutEffect, useState } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TamaguiProvider } from '@tamagui/core';
import config from './tamagui.config';
import { useRoute } from "@react-navigation/native";
// import '@tamagui/core'

function App() {
  // const css = config.getCSS();

  return (<TamaguiProvider config={config}>
        <Navigation />
  </TamaguiProvider>);
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