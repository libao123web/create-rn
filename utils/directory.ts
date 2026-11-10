import { lstat, readdir, rm } from 'node:fs/promises'
import { basename, dirname, resolve } from 'node:path'
import { assertProjectName } from './resolveOptions.js'

export async function statIfExists(target: string) {
  try {
    return await lstat(target)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined
    throw error
  }
}

export function assertChild(base: string, target: string): void {
  if (dirname(resolve(target)) !== resolve(base) || resolve(target) === resolve(base)) {
    throw new Error(`拒绝操作范围外目录：${target}`)
  }
}

export async function inspectTarget(base: string, projectName: string) {
  assertProjectName(projectName)
  const root = resolve(base, projectName)
  assertChild(base, root)
  const stat = await statIfExists(root)
  if (stat?.isSymbolicLink()) throw new Error(`拒绝操作链接目录：${root}`)
  if (stat && !stat.isDirectory()) throw new Error(`目标不是目录：${root}`)
  const names = stat ? await readdir(root) : []
  const entries = new Set(names.map((name) => name.toLowerCase()))
  const looksBare = ['head', 'objects', 'refs', 'config'].every((name) => entries.has(name))
  if (entries.has('.git') || looksBare) {
    throw new Error(`拒绝覆盖已有 Git 仓库：${root}`)
  }
  return { root, exists: Boolean(stat), nonempty: names.length > 0 }
}

export async function removeTemporary(base: string, target: string): Promise<void> {
  assertChild(base, target)
  if (!basename(target).startsWith('.create-rn-')) throw new Error('拒绝清理非临时目录')
  const stat = await statIfExists(target)
  if (stat?.isSymbolicLink()) throw new Error('拒绝递归清理链接目录')
  await rm(target, { recursive: true, force: true })
}
