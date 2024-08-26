import { DefaultTheme, DarkTheme } from '@react-navigation/native';
import { storage } from '../mmkv';
import switchTheme from 'react-native-theme-switch-animation';
import { useMMKV, useMMKVListener } from 'react-native-mmkv';
import { useEffect, useState } from 'react';

const lightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#EEF1FF",
    text: "#212A3E",
    card: "#F9F7F7",
    mirza: "#3F72AF",
    undetlay: "#b2c6df",
    loginMirza: "#00402f",
    boarder: "#b2c6df",
    red: "#DE3163",
    newMessage: "#fff"
  },
};

const darkTheme = {
  ...DarkTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#212A3E",
    text: "#F1F6F9",
    card: "#415266",
    mirza: "#8baacf",
    undetlay: "#353d4f",
    loginMirza: "#508081",
    boarder: "#ccc",
    red: "#FF033E",
    newMessage: "#353d4f"
  }
};

const useTheme = () => {
  const [isDark,setDark] = useState<boolean|undefined>(storage.getBoolean("darkMode"));
  const key = useMMKV({ id: `user-id` });
  useMMKVListener(() => {
    setDark(storage.getBoolean("darkMode"));
  }, key);

  // const listener = storage.addOnValueChangedListener((changedKey) => {
    // setDark(storage.getBoolean("darkMode"));
  // });
  
  // useEffect(()=>{
  //   return () => {
  //     listener.remove();
  //   }
  // },[]);
  
  if (isDark) {
    return darkTheme
  } else {
    return lightTheme
  }
};

export { lightTheme, darkTheme }

export default useTheme;