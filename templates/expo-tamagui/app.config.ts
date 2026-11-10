import type { ExpoConfig } from 'expo/config'

const config: ExpoConfig = {
  name: '__CREATE_RN_APP_NAME__',
  slug: '__CREATE_RN_SLUG__',
  scheme: '__CREATE_RN_SCHEME__',
  version: '0.1.0',
  orientation: 'default',
  userInterfaceStyle: 'automatic',
  plugins:
    process.platform === 'win32'
      ? [['expo-build-properties', { android: { cmakeVersion: '3.31.6' } }]]
      : [],
  ios: { bundleIdentifier: '__CREATE_RN_APP_ID__', supportsTablet: true },
  android: { package: '__CREATE_RN_APP_ID__' },
  web: { bundler: 'metro', output: 'single', name: '__CREATE_RN_APP_NAME__' },
}

export default config
