import { mkdtemp, realpath, rename, rmdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execa } from 'execa'
import { assertChild, inspectTarget, removeTemporary, statIfExists } from './directory.js'
import { renderTemplate } from './renderTemplate.js'
import { resolveDefaults, type CreateOptions } from './resolveOptions.js'

interface Dependencies {
  cwd?: string
  templateDir?: string
  rename?: (from: string, to: string) => Promise<void>
  initGit?: (root: string) => Promise<void>
}

export async function createProject(
  options: CreateOptions,
  dependencies: Dependencies = {},
): Promise<{ root: string; gitWarning?: string }> {
  resolveDefaults(options)
  const base = await realpath(dependencies.cwd ?? process.cwd())
  const target = await inspectTarget(base, options.projectName)
  if (target.nonempty && !options.force) throw new Error('目标目录非空，覆盖请使用 --force')
  const template =
    dependencies.templateDir ??
    fileURLToPath(new URL('../templates/expo-tamagui/', import.meta.url))
  const move = dependencies.rename ?? rename
  const stage = await mkdtemp(join(base, '.create-rn-stage-'))
  let backup: string | undefined
  try {
    await renderTemplate(template, stage, options)
    const current = await inspectTarget(base, options.projectName)
    if (current.exists !== target.exists || (current.nonempty && !options.force)) {
      throw new Error('创建期间目标目录发生变化，请重新运行')
    }
    assertChild(base, stage)
    assertChild(base, target.root)
    if (current.exists) {
      backup = await mkdtemp(join(base, '.create-rn-backup-'))
      assertChild(base, backup)
      await rmdir(backup)
      await move(target.root, backup)
    }
    try {
      await move(stage, target.root)
    } catch (error) {
      if (backup && !(await statIfExists(target.root))) {
        await move(backup, target.root)
        backup = undefined
      }
      throw error
    }
    if (backup) {
      await removeTemporary(base, backup)
      backup = undefined
    }
  } finally {
    await removeTemporary(base, stage)
  }

  let gitWarning: string | undefined
  if (options.git) {
    try {
      await (
        dependencies.initGit ??
        (async (root) => {
          await execa('git', ['init'], { cwd: root, timeout: 15_000 })
        })
      )(target.root)
    } catch (error) {
      gitWarning = `项目已创建，Git 初始化未完成：${error instanceof Error ? error.message : String(error)}`
    }
  }
  return { root: target.root, gitWarning }
}
