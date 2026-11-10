import { defaultConfig } from '@tamagui/config/v6'
import { createTamagui } from 'tamagui'
import { palette } from './palette'

export const tamaguiConfig = createTamagui({
  ...defaultConfig,
  themes: {
    ...defaultConfig.themes,
    light: {
      ...defaultConfig.themes.light,
      ...palette.light,
      'border-color': palette.light.border,
      'accent-background': palette.light.accent,
      'accent-color': palette.light.accentText,
    },
    dark: {
      ...defaultConfig.themes.dark,
      ...palette.dark,
      'border-color': palette.dark.border,
      'accent-background': palette.dark.accent,
      'accent-color': palette.dark.accentText,
    },
  },
})

type AppConfig = typeof tamaguiConfig
declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}
