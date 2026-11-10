import type { ReactNode } from 'react'
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { TamaguiProvider } from 'tamagui'
import { StatusBar } from 'expo-status-bar'
import { tamaguiConfig } from '../theme/config'
import { useAppTheme } from '../theme/useAppTheme'
import { linking } from '../navigation/linking'
import { ErrorBoundary } from './ErrorBoundary'

export function AppProviders({ children }: { children: ReactNode }) {
  const { scheme, colors } = useAppTheme()
  const baseTheme = scheme === 'dark' ? DarkTheme : DefaultTheme
  const navigationTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: colors.accent,
      background: colors.background,
      card: colors.surface,
      text: colors.color,
      border: colors.border,
    },
  }
  return (
    <SafeAreaProvider>
      <TamaguiProvider config={tamaguiConfig} defaultTheme={scheme}>
        <ErrorBoundary>
          <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
          <NavigationContainer theme={navigationTheme} linking={linking}>
            {children}
          </NavigationContainer>
        </ErrorBoundary>
      </TamaguiProvider>
    </SafeAreaProvider>
  )
}
