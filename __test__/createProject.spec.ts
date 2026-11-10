import { mkdtemp, mkdir, readFile, readdir, rename, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, basename } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createProject } from '../utils/createProject.js'
import { resolveDefaults } from '../utils/resolveOptions.js'

describe('safe project creation', () => {
  let cwd: string
  let templateDir: string
  const options = () =>
    resolveDefaults({ projectName: 'demo', git: false, appName: 'Demo "app"\n测试' })

  beforeEach(async () => {
    cwd = await mkdtemp(join(tmpdir(), 'create-rn-test-'))
    templateDir = join(cwd, 'template')
    await mkdir(templateDir)
    await writeFile(join(templateDir, 'package.json'), '{"name":"__CREATE_RN_PROJECT_NAME__"}')
    await writeFile(
      join(templateDir, 'app.config.ts'),
      'export default {name:"__CREATE_RN_APP_NAME__", id:"__CREATE_RN_APP_ID__",scheme:"__CREATE_RN_SCHEME__"}',
    )
    await writeFile(join(templateDir, '_gitignore'), 'node_modules\n')
    await writeFile(join(templateDir, '.env.example'), 'EXPO_PUBLIC_API_URL=\n')
  })
  afterEach(async () => {
    if (!basename(cwd).startsWith('create-rn-test-')) throw new Error('unsafe cleanup')
    await rm(cwd, { recursive: true, force: true })
  })

  it('renders all metadata safely and restores dotfiles', async () => {
    const { root } = await createProject(options(), { cwd, templateDir })
    expect(JSON.parse(await readFile(join(root, 'package.json'), 'utf8')).name).toBe('demo')
    const config = await readFile(join(root, 'app.config.ts'), 'utf8')
    expect(config).toContain('name:"Demo \\"app\\"\\n测试"')
    expect(config).toContain('id:"com.example.demo"')
    expect(config).not.toContain('__CREATE_RN_')
    expect(await readFile(join(root, '.gitignore'), 'utf8')).toBe('node_modules\n')
    expect(await readFile(join(root, '.env.example'), 'utf8')).toBe('EXPO_PUBLIC_API_URL=\n')
  })

  it('refuses a nonempty target without force', async () => {
    await mkdir(join(cwd, 'demo'))
    await writeFile(join(cwd, 'demo/old.txt'), 'keep')
    await expect(createProject(options(), { cwd, templateDir })).rejects.toThrow(/非空/)
    expect(await readFile(join(cwd, 'demo/old.txt'), 'utf8')).toBe('keep')
  })

  it('safely renders formatted TypeScript with single-quoted markers', async () => {
    await writeFile(
      join(templateDir, 'app.config.ts'),
      "export default { name: '__CREATE_RN_APP_NAME__' }",
    )
    const { root } = await createProject(options(), { cwd, templateDir })
    expect(await readFile(join(root, 'app.config.ts'), 'utf8')).toContain(
      'name: "Demo \\"app\\"\\n测试"',
    )
  })

  it('replaces the target only after successful rendering', async () => {
    await mkdir(join(cwd, 'demo'))
    await writeFile(join(cwd, 'demo/old.txt'), 'old')
    await createProject({ ...options(), force: true }, { cwd, templateDir })
    expect(await readdir(join(cwd, 'demo'))).not.toContain('old.txt')
    expect((await readdir(cwd)).filter((name) => name.startsWith('.create-rn-'))).toEqual([])
  })

  it('restores old contents when promotion fails', async () => {
    await mkdir(join(cwd, 'demo'))
    await writeFile(join(cwd, 'demo/old.txt'), 'keep')
    await expect(
      createProject(
        { ...options(), force: true },
        {
          cwd,
          templateDir,
          rename: async (from, to) => {
            if (basename(from).startsWith('.create-rn-stage-')) throw new Error('disk failure')
            await rename(from, to)
          },
        },
      ),
    ).rejects.toThrow('disk failure')
    expect(await readFile(join(cwd, 'demo/old.txt'), 'utf8')).toBe('keep')
  })

  it('does not touch old contents if template rendering fails', async () => {
    await mkdir(join(cwd, 'demo'))
    await writeFile(join(cwd, 'demo/old.txt'), 'keep')
    await writeFile(join(templateDir, 'bad.txt'), '"__CREATE_RN_UNKNOWN__"')
    await expect(
      createProject({ ...options(), force: true }, { cwd, templateDir }),
    ).rejects.toThrow(/模板/)
    expect(await readFile(join(cwd, 'demo/old.txt'), 'utf8')).toBe('keep')
  })

  it('refuses existing git repositories even with force', async () => {
    await mkdir(join(cwd, 'demo/.git'), { recursive: true })
    await expect(
      createProject({ ...options(), force: true }, { cwd, templateDir }),
    ).rejects.toThrow(/Git/)
  })

  it('preserves bare Git repositories even when Git execution is disabled', async () => {
    const root = join(cwd, 'demo')
    await mkdir(join(root, 'objects'), { recursive: true })
    await mkdir(join(root, 'refs'))
    await writeFile(join(root, 'HEAD'), 'ref: refs/heads/main\n')
    await writeFile(join(root, 'config'), '[core]\n  bare = true\n')
    await expect(
      createProject({ ...options(), force: true }, { cwd, templateDir }),
    ).rejects.toThrow(/Git/)
    expect(await readFile(join(root, 'HEAD'), 'utf8')).toBe('ref: refs/heads/main\n')
    expect(await readFile(join(root, 'config'), 'utf8')).toContain('bare = true')
  })

  it('refuses symlink targets and leaves their contents intact', async () => {
    await mkdir(join(cwd, 'outside'))
    await writeFile(join(cwd, 'outside/keep'), 'safe')
    await symlink(
      join(cwd, 'outside'),
      join(cwd, 'demo'),
      process.platform === 'win32' ? 'junction' : 'dir',
    )
    await expect(
      createProject({ ...options(), force: true }, { cwd, templateDir }),
    ).rejects.toThrow(/链接/)
    expect(await readFile(join(cwd, 'outside/keep'), 'utf8')).toBe('safe')
  })

  it('preserves a generated project if git cannot initialize', async () => {
    const result = await createProject(
      { ...options(), git: true },
      {
        cwd,
        templateDir,
        initGit: async () => {
          throw new Error('git unavailable')
        },
      },
    )
    expect(result.gitWarning).toContain('git unavailable')
    expect(JSON.parse(await readFile(join(result.root, 'package.json'), 'utf8')).name).toBe('demo')
  })
})
