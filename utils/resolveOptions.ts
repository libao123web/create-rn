import { parseArgs } from 'node:util'
import pkg from '../package.json' with { type: 'json' }
import { inferPackageManager, isPackageManager, type PackageManager } from './packageManager.js'

export class UsageError extends Error {
  readonly exitCode = 2
  constructor(message: string) {
    super(message)
    this.name = 'UsageError'
  }
}

export interface PartialOptions {
  projectName?: string
  appName?: string
  appId?: string
  packageManager?: PackageManager
  yes?: boolean
  force?: boolean
  git?: boolean
}

export interface CreateOptions {
  projectName: string
  slug: string
  appName: string
  appId: string
  scheme: string
  packageManager: PackageManager
  force: boolean
  git: boolean
}

export type ParsedCli =
  | { mode: 'help' }
  | { mode: 'version'; version: string }
  | { mode: 'create'; options: PartialOptions }

export const HELP_TEXT = `create-rn — 创建 Expo + Tamagui 多端项目（Android / iOS / Web）

用法：create-rn [project-name] [options]

  -y, --yes                    跳过问答，使用默认值（需项目名）
  --app-name <name>             应用显示名（默认：项目名）
  --app-id <id>                 应用标识，如 com.company.myapp
  -m, --package-manager <pm>    npm | pnpm | yarn | bun
  --force                      覆盖非空子目录（拒绝 Git 仓库和链接）
  --no-git                     不初始化 Git
  -h, --help                   显示帮助
  -v, --version                显示版本

示例：create-rn my-app -y --app-id com.company.myapp -m pnpm

非交互环境：需项目名；其他选项使用默认值。不自动安装依赖。
退出码：0 成功/取消，1 运行失败，2 参数误用。
`

export function assertProjectName(name: string): void {
  if (
    !/^[a-z0-9][a-z0-9._-]*$/.test(name) ||
    name.length > 100 ||
    name.endsWith('.') ||
    /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\.|$)/i.test(name) ||
    name === 'node_modules'
  ) {
    throw new UsageError('项目名须为小写 npm 包名和安全目录名，不接受路径或 Windows 保留名')
  }
}

const androidReserved = new Set(
  'abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for goto if implements import instanceof int interface long native new package private protected public return short static strictfp super switch synchronized this throw throws transient try void volatile while true false null as fun in is object typealias typeof val var when'.split(
    ' ',
  ),
)

export function assertAppId(id: string): void {
  if (
    !/^[a-zA-Z][a-zA-Z0-9]*(?:\.[a-zA-Z][a-zA-Z0-9]*)+$/.test(id) ||
    id.split('.').some((segment) => androidReserved.has(segment))
  ) {
    throw new UsageError(
      '应用标识须为反向域名，每段以字母开头，仅含字母和数字，且不能是 Java/Kotlin 保留字，如 com.company.myapp',
    )
  }
}

export function assertAppName(name: string): void {
  if (!name.trim() || name.length > 100 || name.includes('\0')) {
    throw new UsageError('应用显示名不能为空、不能包含 NUL，且最多 100 个字符')
  }
}

export function resolveDefaults(input: PartialOptions, agent?: string): CreateOptions {
  if (!input.projectName) throw new UsageError('请提供项目名，例如 create-rn my-app --yes')
  assertProjectName(input.projectName)
  const suffix = input.projectName.replace(/[^a-z0-9]/g, '')
  const appId =
    input.appId ??
    `com.example.${/^[a-z]/.test(suffix) && !androidReserved.has(suffix) ? suffix : `app${suffix}`}`
  const appName = input.appName ?? input.projectName
  assertAppId(appId)
  assertAppName(appName)
  return {
    projectName: input.projectName,
    slug: input.projectName.replace(/\./g, '-'),
    appName,
    appId,
    scheme: (/^[a-z]/.test(input.projectName)
      ? input.projectName
      : `app-${input.projectName}`
    ).replace(/_/g, '-'),
    packageManager: input.packageManager ?? inferPackageManager(agent),
    force: input.force ?? false,
    git: input.git ?? true,
  }
}

export function parseCli(argv = process.argv.slice(2)): ParsedCli {
  let parsed: ReturnType<typeof parseArgs>
  try {
    parsed = parseArgs({
      args: argv,
      allowPositionals: true,
      strict: true,
      options: {
        help: { type: 'boolean', short: 'h' },
        version: { type: 'boolean', short: 'v' },
        yes: { type: 'boolean', short: 'y' },
        'app-name': { type: 'string' },
        'app-id': { type: 'string' },
        'package-manager': { type: 'string', short: 'm' },
        force: { type: 'boolean' },
        'no-git': { type: 'boolean' },
      },
    })
  } catch (error) {
    throw new UsageError(error instanceof Error ? error.message : String(error))
  }
  const { values, positionals } = parsed
  if (values.help) return { mode: 'help' }
  if (values.version) return { mode: 'version', version: pkg.version }
  if (positionals.length > 1) throw new UsageError('只接受一个项目名')
  const projectName = positionals[0]
  if (projectName !== undefined) assertProjectName(projectName)
  const appName = values['app-name'] as string | undefined
  const appId = values['app-id'] as string | undefined
  const pm = values['package-manager'] as string | undefined
  if (appName !== undefined) assertAppName(appName)
  if (appId !== undefined) assertAppId(appId)
  if (pm !== undefined && !isPackageManager(pm))
    throw new UsageError('包管理器须为 npm/pnpm/yarn/bun')
  return {
    mode: 'create',
    options: {
      projectName,
      appName,
      appId,
      packageManager: pm as PackageManager | undefined,
      yes: Boolean(values.yes),
      force: Boolean(values.force),
      git: !values['no-git'],
    },
  }
}
