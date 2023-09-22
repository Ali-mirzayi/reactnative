import * as React from 'react';
import { DefaultTheme, DarkTheme } from '@react-navigation/native';

const lightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: "#EEF1FF",
      text: "#212A3E",
      card:"#F9F7F7"
    },
  };
  
const darkTheme = {
    ...DarkTheme,
    colors: {
        ...DefaultTheme.colors,
        background: "#212A3E",
        text: "#F1F6F9",
        card:"#F9F7F7"
    }

};

export {lightTheme,darkTheme}