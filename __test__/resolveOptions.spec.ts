import { describe, expect, it } from 'vitest'
import { parseCli, resolveDefaults, UsageError } from '../utils/resolveOptions.js'
import { getCommand } from '../utils/packageManager.js'

describe('CLI contract', () => {
  it('returns help and version without requiring a project', () => {
    expect(parseCli(['--help']).mode).toBe('help')
    expect(parseCli(['-v'])).toEqual({ mode: 'version', version: '0.1.0' })
  })

  it('resolves a fully portable set of defaults', () => {
    expect(resolveDefaults({ projectName: 'my-app' }, 'npm/11')).toMatchObject({
      projectName: 'my-app',
      appName: 'my-app',
      appId: 'com.example.myapp',
      scheme: 'my-app',
      packageManager: 'npm',
      force: false,
      git: true,
    })
    expect(resolveDefaults({ projectName: '123-app' }).appId).toBe('com.example.app123app')
  })

  it('accepts metadata without interpreting display names as code', () => {
    const parsed = parseCli([
      'demo',
      '-y',
      '--app-name',
      'Demo "App"\n测试',
      '--app-id',
      'cn.company.demo',
      '-m',
      'pnpm',
      '--no-git',
    ])
    expect(parsed).toMatchObject({
      mode: 'create',
      options: {
        projectName: 'demo',
        yes: true,
        appName: 'Demo "App"\n测试',
        appId: 'cn.company.demo',
        packageManager: 'pnpm',
        git: false,
      },
    })
  })

  it('normalizes npm names into valid Expo slugs and URL schemes', () => {
    expect(resolveDefaults({ projectName: 'my_app.demo' })).toMatchObject({
      projectName: 'my_app.demo',
      slug: 'my_app-demo',
      scheme: 'my-app.demo',
    })
  })

  it('avoids Java keywords in generated application IDs', () => {
    expect(resolveDefaults({ projectName: 'class' }).appId).toBe('com.example.appclass')
    expect(resolveDefaults({ projectName: 'native' }).appId).toBe('com.example.appnative')
    expect(() => parseCli(['demo', '--app-id', 'com.class.demo'])).toThrow(UsageError)
    expect(() => parseCli(['demo', '--app-id', 'com.example.null'])).toThrow(UsageError)
  })

  it.each([
    ['when', 'com.example.appwhen'],
    ['object', 'com.example.appobject'],
    ['val', 'com.example.appval'],
    ['var', 'com.example.appvar'],
    ['typealias', 'com.example.apptypealias'],
  ])('avoids Kotlin keyword %s in Android application IDs', (name, expected) => {
    expect(resolveDefaults({ projectName: name }).appId).toBe(expected)
    expect(() => parseCli(['demo', '--app-id', `com.${name}.demo`])).toThrow(UsageError)
  })

  it.each([
    '.',
    '..',
    '../escape',
    'dir/app',
    'dir\\app',
    'MyApp',
    '.hidden',
    '-option',
    'con',
    'NUL',
    'com1',
    'lpt9',
    'demo.',
    'node_modules',
  ])('rejects unsafe project name %s', (name) => {
    expect(() => parseCli(['--', name])).toThrow(UsageError)
  })

  it.each(['com.demo-app', 'demo', 'com.123', 'com.demo_app', 'com..demo'])(
    'rejects invalid application ID %s',
    (id) => {
      expect(() => parseCli(['demo', '--app-id', id])).toThrow(UsageError)
    },
  )

  it.each([
    ['demo', '--unknown'],
    ['demo', '-m', 'deno'],
    ['demo', '--app-name', ' '],
    ['demo', 'extra'],
    ['demo', '--app-id', ''],
    [''],
  ])('rejects misuse %j', (...args) => {
    expect(() => parseCli(args)).toThrow(UsageError)
  })

  it('prints runnable package manager commands', () => {
    expect(getCommand('npm', 'install')).toBe('npm install')
    expect(getCommand('npm', 'web')).toBe('npm run web')
    expect(getCommand('pnpm', 'web')).toBe('pnpm web')
    expect(getCommand('yarn', 'install')).toBe('yarn install')
    expect(getCommand('bun', 'web')).toBe('bun run web')
  })
})
