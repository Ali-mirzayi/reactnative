import { config } from '@tamagui/config'
// import { shorthands } from '@tamagui/shorthands'
// import { themes, tokens } from '@tamagui/themes'
import { Text, View } from 'react-native'
import { createTamagui, setupReactNative,createFont, createTokens } from '@tamagui/core'
import { createMedia } from '@tamagui/react-native-media-driver'

const interFont = createFont({
    family: 'Inter, Helvetica, Arial, sans-serif',
    size: {
      1: 12,
      2: 14,
      3: 15,
    },
    lineHeight: {
      // 1 will be 22
      2: 22,
    },
    weight: {
      1: '300',
      // 2 will be 300
      3: '600',
    },
    letterSpacing: {
      1: 0,
      2: -1,
      // 3 will be -1
    },
    // (native) swap out fonts by face/style
    face: {
      300: { normal: 'InterLight', italic: 'InterItalic' },
      600: { normal: 'InterBold' },
    },
  })

  const size = {
    0: 0,
    1: 5,
    2: 10,
    // ....
  }

  export const tokens = createTokens({
    size,
    space: { ...size, '-1': -5, '-2': -10 },
    radius: { 0: 0, 1: 3 },
    zIndex: { 0: 0, 1: 100, 2: 200 },
    color: {
      white: '#fff',
      black: '#000',
    },
  })

//   export default createTamagui({
    media: createMedia({
        xs: { maxWidth: 660 },
        sm: { maxWidth: 860 },
        gtSm: { minWidth: 860 + 1 },
        short: { maxHeight: 820 },
        hoverNone: { hover: 'none' },
        pointerCoarse: { pointer: 'coarse' },
    }),
//   })

setupReactNative({
  Text,
  View,
})

const appConfig = createTamagui(config)

export type AppConfig = typeof appConfig

declare module '@tamagui/core' {    
  // overrides TamaguiCustomConfig so your custom types
  // work everywhere you import `tamagui`
  interface TamaguiCustomConfig extends AppConfig {}

  interface TypeOverride {
    groupNames(): 'a' | 'b' | 'c'
  }
}

export default appConfig