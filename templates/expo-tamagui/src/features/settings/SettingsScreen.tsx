import { AppButton, AppCard, AppText, Screen } from '../../components/ui'
import { useAppStore, type ThemePreference } from '../../store/appStore'

const choices: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: '跟随系统' },
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
]

export function SettingsScreen() {
  const preference = useAppStore((state) => state.themePreference)
  const setPreference = useAppStore((state) => state.setThemePreference)
  return (
    <Screen>
      <AppText fontSize={30} lineHeight={1.33} fontWeight="700">
        让应用更适合你
      </AppText>
      <AppText tone="muted">主题同时作用于组件、页面背景、导航和状态栏。</AppText>
      <AppCard>
        <AppText fontWeight="600">主题模式</AppText>
        {choices.map(({ value, label }) => (
          <AppButton
            key={value}
            title={label}
            variant={preference === value ? 'primary' : 'secondary'}
            accessibilityState={{ selected: preference === value }}
            onPress={() => setPreference(value)}
          />
        ))}
        <AppText tone="muted" fontSize={13}>
          偏好保存在本次运行中；持久化存储可按项目需求扩展。
        </AppText>
      </AppCard>
    </Screen>
  )
}
