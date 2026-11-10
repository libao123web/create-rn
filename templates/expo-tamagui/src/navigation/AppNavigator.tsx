import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { HomeScreen } from '../features/home/HomeScreen'
import { SettingsScreen } from '../features/settings/SettingsScreen'
import type { RootStackParamList } from './types'

const Stack = createNativeStackNavigator<RootStackParamList>()

export function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: '工作台' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: '外观设置' }} />
    </Stack.Navigator>
  )
}
