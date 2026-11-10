import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Text, View } from 'react-native'

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application error', error, info.componentStack)
  }
  render() {
    if (this.state.failed) {
      return (
        <View style={{ flex: 1, padding: 32, justifyContent: 'center' }} accessibilityRole="alert">
          <Text>页面暂时无法显示，请重新启动应用。</Text>
        </View>
      )
    }
    return this.props.children
  }
}
