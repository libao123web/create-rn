import type { LinkingOptions } from '@react-navigation/native'
import Constants from 'expo-constants'
import type { RootStackParamList } from './types'

const scheme = Constants.expoConfig?.scheme
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: typeof scheme === 'string' ? [`${scheme}://`] : [],
  config: { screens: { Home: '', Settings: 'settings' } },
}
