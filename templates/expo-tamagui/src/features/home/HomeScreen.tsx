import { useState } from 'react'
import { Platform } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import Constants from 'expo-constants'
import { AppButton, AppCard, AppInput, AppText, Screen, XStack, YStack } from '../../components/ui'
import { useAppStore } from '../../store/appStore'
import type { RootStackParamList } from '../../navigation/types'

export function HomeScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Home'>) {
  const count = useAppStore((state) => state.count)
  const increment = useAppStore((state) => state.increment)
  const reset = useAppStore((state) => state.reset)
  const [name, setName] = useState('')
  return (
    <Screen>
      <YStack gap={8}>
        <AppText tone="muted" fontSize={12} letterSpacing={2}>
          EXPO / REACT NATIVE / TAMAGUI
        </AppText>
        <AppText fontSize={34} lineHeight={1.3} fontWeight="700">
          {Constants.expoConfig?.name ?? '你的新应用'}
        </AppText>
        <AppText tone="muted">从这里开始，构建你的下一个跨端产品。</AppText>
      </YStack>
      <AppCard>
        <XStack justify="space-between" items="center">
          <AppText fontWeight="600">一份代码，三个平台</AppText>
          <AppText tone="muted" fontSize={13}>
            {Platform.OS.toUpperCase()}
          </AppText>
        </XStack>
        <AppText tone="muted">
          Android、iOS 与 Web 共用页面、状态和设计系统。组件按职责组织，业务逻辑独立扩展。
        </AppText>
        <AppButton title="调整应用外观" onPress={() => navigation.navigate('Settings')} />
      </AppCard>
      <AppCard>
        <AppText fontWeight="600">试试共享状态</AppText>
        <AppText fontSize={48} lineHeight={1.25} fontWeight="700" aria-live="polite">
          {count}
        </AppText>
        <XStack gap={12}>
          <YStack flex={1}>
            <AppButton title="增加一次" onPress={increment} />
          </YStack>
          <YStack flex={1}>
            <AppButton title="重置" variant="secondary" onPress={reset} disabled={count === 0} />
          </YStack>
        </XStack>
      </AppCard>
      <AppCard>
        <AppText fontWeight="600">统一的输入组件</AppText>
        <AppInput
          aria-label="你的称呼"
          placeholder="输入你的称呼"
          value={name}
          onChangeText={setName}
        />
        <AppText tone="muted">
          {name ? `你好，${name}。欢迎开始构建。` : '输入内容，即可体验跨端交互。'}
        </AppText>
      </AppCard>
      <AppText tone="muted" fontSize={13}>
        组件位于 src/components/ui，功能位于 src/features。
      </AppText>
    </Screen>
  )
}
