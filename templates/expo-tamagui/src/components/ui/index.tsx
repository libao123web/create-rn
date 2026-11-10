import type { ComponentProps, ReactNode } from 'react'
import { ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, ButtonText, Input, Spinner, Text, YStack, XStack } from 'tamagui'
import { useAppTheme } from '../../theme/useAppTheme'

export { XStack, YStack }

export function AppText({
  tone = 'default',
  ...props
}: ComponentProps<typeof Text> & { tone?: 'default' | 'muted' }) {
  return (
    <Text color={tone === 'muted' ? 'muted' : 'color'} fontSize={16} lineHeight={1.5} {...props} />
  )
}

export function AppButton({
  title,
  loading = false,
  disabled,
  variant = 'primary',
  accessibilityState,
  ...props
}: Omit<ComponentProps<typeof Button>, 'children' | 'variant'> & {
  title: string
  loading?: boolean
  variant?: 'primary' | 'secondary'
}) {
  return (
    <Button
      minH={48}
      rounded={14}
      bg={variant === 'primary' ? 'accent' : 'surface'}
      borderWidth={1}
      borderColor={variant === 'primary' ? 'accent' : 'border'}
      disabled={disabled || loading}
      opacity={disabled ? 0.5 : 1}
      accessibilityLabel={title}
      accessibilityState={{ ...accessibilityState, disabled: disabled || loading, busy: loading }}
      aria-label={title}
      aria-busy={loading}
      aria-pressed={accessibilityState?.selected}
      {...props}
    >
      {loading ? (
        <Spinner color={variant === 'primary' ? 'accentText' : 'color'} />
      ) : (
        <ButtonText
          color={variant === 'primary' ? 'accentText' : 'color'}
          fontSize={16}
          fontWeight="600"
        >
          {title}
        </ButtonText>
      )}
    </Button>
  )
}

export function AppInput(props: ComponentProps<typeof Input>) {
  return (
    <Input
      minH={48}
      bg="surface"
      color="color"
      borderColor="border"
      rounded={12}
      placeholderTextColor="muted"
      {...props}
    />
  )
}

export function AppCard({ children }: { children: ReactNode }) {
  return (
    <YStack bg="surface" borderWidth={1} borderColor="border" rounded={20} p={24} gap={16}>
      {children}
    </YStack>
  )
}

export function Screen({ children }: { children: ReactNode }) {
  const { colors } = useAppTheme()
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['left', 'right', 'bottom']}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 24, alignItems: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        <YStack w="100%" maxW={680} gap={24} py={16}>
          {children}
        </YStack>
      </ScrollView>
    </SafeAreaView>
  )
}
