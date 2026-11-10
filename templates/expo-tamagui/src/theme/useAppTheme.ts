import { useColorScheme } from 'react-native'
import { useAppStore } from '../store/appStore'
import { palette } from './palette'

export function useAppTheme() {
  const system = useColorScheme()
  const preference = useAppStore((state) => state.themePreference)
  const scheme = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference
  return { scheme, colors: palette[scheme] }
}
