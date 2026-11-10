import { fileURLToPath } from 'node:url'
import {
  CANCEL_SYMBOL,
  confirm,
  intro,
  isCancel,
  outro,
  select,
  spinner,
  text,
  cancel,
  log,
} from '@clack/prompts'
import pc from 'picocolors'
import { createProject } from './utils/createProject.js'
import { inspectTarget } from './utils/directory.js'
import {
  availablePackageManagers,
  getCommand,
  inferPackageManager,
} from './utils/packageManager.js'
import {
  assertAppId,
  assertAppName,
  assertProjectName,
  HELP_TEXT,
  parseCli,
  resolveDefaults,
  UsageError,
  type PartialOptions,
} from './utils/resolveOptions.js'

class Cancelled extends Error {}

async function ask<T>(promise: Promise<T | typeof CANCEL_SYMBOL>): Promise<T> {
  const result = await promise
  if (isCancel(result)) throw new Cancelled()
  return result as T
}

function validate(assert: (value: string) => void) {
  return (value: string | undefined) => {
    try {
      assert(value ?? '')
      return undefined
    } catch (error) {
      return error instanceof Error ? error.message : String(error)
    }
  }
}

async function promptOptions(partial: PartialOptions) {
  if (!partial.projectName) {
    partial.projectName = await ask(
      text({ message: '项目名称', placeholder: 'my-app', validate: validate(assertProjectName) }),
    )
  }
  const defaults = resolveDefaults(partial)
  if (partial.appName === undefined) {
    partial.appName = await ask(
      text({
        message: '应用显示名',
        defaultValue: defaults.appName,
        placeholder: defaults.appName,
        validate: validate(assertAppName),
      }),
    )
  }
  if (partial.appId === undefined) {
    partial.appId = await ask(
      text({
        message: '应用标识（Android / iOS）',
        defaultValue: defaults.appId,
        placeholder: defaults.appId,
        validate: validate(assertAppId),
      }),
    )
  }
  if (!partial.packageManager) {
    const available = await availablePackageManagers()
    const choices = available.length ? available : ['npm' as const]
    partial.packageManager = await ask(
      select({
        message: '包管理器',
        options: choices.map((value) => ({ value, label: value })),
        initialValue: choices.includes(inferPackageManager()) ? inferPackageManager() : choices[0],
      }),
    )
  }
  return resolveDefaults(partial)
}

async function main(): Promise<void> {
  const parsed = parseCli()
  if (parsed.mode === 'help') {
    console.log(HELP_TEXT)
    return
  }
  if (parsed.mode === 'version') {
    console.log(parsed.version)
    return
  }
  const interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY && !parsed.options.yes)
  if (!interactive && !parsed.options.projectName)
    throw new UsageError('非交互模式需提供项目名，例如 create-rn my-app --yes')
  intro(pc.cyan('create-rn · Expo + Tamagui · Android / iOS / Web'))
  const options = interactive
    ? await promptOptions(parsed.options)
    : resolveDefaults(parsed.options)
  const target = await inspectTarget(process.cwd(), options.projectName)
  if (target.nonempty && !options.force && interactive) {
    if (
      !(await ask(
        confirm({ message: `目录 ${options.projectName} 非空，是否覆盖？`, initialValue: false }),
      ))
    )
      throw new Cancelled()
    options.force = true
  }
  const status = spinner()
  status.start('正在创建项目…')
  try {
    // In the bundle import.meta.url points at bundle.js, beside templates/.
    const templateDir = fileURLToPath(new URL('./templates/expo-tamagui/', import.meta.url))
    const result = await createProject(options, { templateDir })
    status.stop('项目已创建')
    if (result.gitWarning) log.warn(result.gitWarning)
  } catch (error) {
    status.stop('创建失败')
    throw error
  }
  const lines = [
    'cd ' + options.projectName,
    getCommand(options.packageManager, 'install'),
    getCommand(options.packageManager, 'dev'),
  ]
  outro(
    `${options.appName} 已就绪\n\n${lines.map((line) => `  ${line}`).join('\n')}\n\n各端入口：\n  ${['web', 'android', 'ios'].map((script) => getCommand(options.packageManager, script)).join('\n  ')}\n\niOS 本地运行需要 macOS / Xcode；构建步骤见生成项目 README。`,
  )
}

main().catch((error: unknown) => {
  if (error instanceof Cancelled) {
    cancel('已取消')
    process.exitCode = 0
    return
  }
  console.error(pc.red(error instanceof Error ? error.message : String(error)))
  process.exitCode = error instanceof UsageError ? 2 : 1
})
