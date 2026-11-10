import { execa } from 'execa'

export const packageManagers = ['npm', 'pnpm', 'yarn', 'bun'] as const
export type PackageManager = (typeof packageManagers)[number]

export function isPackageManager(value: string): value is PackageManager {
  return packageManagers.some((pm) => pm === value)
}

export function inferPackageManager(
  agent = process.env.npm_config_user_agent ?? '',
): PackageManager {
  const name = agent.split('/')[0]
  return isPackageManager(name) ? name : 'npm'
}

export async function availablePackageManagers(): Promise<PackageManager[]> {
  const results = await Promise.all(
    packageManagers.map(async (pm) => {
      try {
        await execa(pm, ['--version'], { timeout: 5000 })
        return pm
      } catch {
        return undefined
      }
    }),
  )
  return results.filter((pm): pm is PackageManager => pm !== undefined)
}

export function getCommand(pm: PackageManager, script: string): string {
  if (script === 'install') return `${pm} install`
  return pm === 'npm' || pm === 'bun' ? `${pm} run ${script}` : `${pm} ${script}`
}
