import * as React from 'react';
import { DefaultTheme, DarkTheme } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import { storage } from '../mmkv';

const lightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: "#EEF1FF",
      text: "#212A3E",
      card:"#F9F7F7",
      mirza:"#3F72AF",
      undetlay:"#b2c6df",
      loginMirza:"#00402f"
    },
  };
  
const darkTheme = {
    ...DarkTheme,
    colors: {
        ...DefaultTheme.colors,
        background: "#212A3E",
        text: "#F1F6F9",
        card:"#415266",
        mirza:"#8baacf",
        undetlay:"#353d4f",
        loginMirza:"#508081"
    }

};

const useTheme = () => {
  const darkMode = storage.getBoolean("darkMode");
  if(!darkMode){
    return lightTheme
  }else{
    return darkTheme
  }
}

export {lightTheme,darkTheme}

export default useTheme;