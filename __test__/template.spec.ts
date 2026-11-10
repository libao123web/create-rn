import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import { expect, it } from 'vitest'
import { createProject } from '../utils/createProject.js'
import { resolveDefaults } from '../utils/resolveOptions.js'

it('creates a complete independent Expo project from the shipped template', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'create-rn-template-'))
  if (!basename(cwd).startsWith('create-rn-template-')) throw new Error('unsafe cleanup')
  try {
    const result = await createProject(
      resolveDefaults({
        projectName: 'test-app',
        appName: '测试 App',
        appId: 'cn.example.testapp',
        git: false,
      }),
      {
        cwd,
        templateDir: fileURLToPath(new URL('../templates/expo-tamagui/', import.meta.url)),
      },
    )
    const pkg = JSON.parse(await readFile(join(result.root, 'package.json'), 'utf8'))
    expect(pkg.name).toBe('test-app')
    expect(pkg.private).toBe(true)
    expect(pkg.scripts['build:web']).toBe('expo export --platform web')
    expect(pkg.dependencies['react-native']).toBe('0.88.1')
    expect(pkg.dependencies.tamagui).toBeDefined()
    const config = await readFile(join(result.root, 'app.config.ts'), 'utf8')
    expect(config).toContain('"cn.example.testapp"')
    expect(config).toContain('"测试 App"')
    const compiledConfig = ts.transpileModule(config, {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText
    const windows = {
      exports: {} as { default?: { plugins?: unknown[] } },
      process: { platform: 'win32' },
    }
    const linux = {
      exports: {} as { default?: { plugins?: unknown[] } },
      process: { platform: 'linux' },
    }
    runInNewContext(compiledConfig, windows)
    runInNewContext(compiledConfig, linux)
    expect(JSON.parse(JSON.stringify(windows.exports.default?.plugins ?? null))).toEqual([
      ['expo-build-properties', { android: { cmakeVersion: '3.31.6' } }],
    ])
    expect(linux.exports.default?.plugins).toEqual([])
    async function inspect(dir: string) {
      for (const entry of await readdir(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name)
        if (entry.isDirectory()) await inspect(path)
        else {
          const content = await readFile(path, 'utf8')
          expect(content, path).not.toMatch(
            /__CREATE_RN_|(?:file|link|workspace):|soulmate|E:\\work|E:\/work/,
          )
        }
      }
    }
    await inspect(result.root)
    expect(await readdir(result.root)).toEqual(
      expect.arrayContaining([
        '.env.example',
        '.gitignore',
        'App.tsx',
        'index.ts',
        'src',
        'README.md',
      ]),
    )
  } finally {
    await rm(cwd, { recursive: true, force: true })
  }
})
