import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execa } from 'execa'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const entry = fileURLToPath(new URL('../index.ts', import.meta.url))
describe('CLI process in an empty external working directory', () => {
  let cwd: string
  beforeEach(async () => {
    cwd = await mkdtemp(join(tmpdir(), 'create-rn-cli-'))
  })
  afterEach(async () => {
    if (!basename(cwd).startsWith('create-rn-cli-')) throw new Error('unsafe cleanup')
    await rm(cwd, { recursive: true, force: true })
  })
  const run = (args: string[]) =>
    execa(process.execPath, ['--import', import.meta.resolve('tsx'), entry, ...args], {
      cwd,
      reject: false,
      env: { CI: '1', FORCE_COLOR: '0' },
    })

  it('prints help and version without touching the directory', async () => {
    expect((await run(['--help'])).stdout).toContain('create-rn')
    expect((await run(['-v'])).stdout).toBe('0.1.0')
  })
  it('does not hang without a project in non-TTY mode', async () => {
    const result = await run([])
    expect(result.exitCode).toBe(2)
    expect(result.stderr).toContain('项目名')
  })
  it('creates a project then refuses to overwrite it by default', async () => {
    const result = await run(['demo', '-y', '--no-git', '-m', 'pnpm'])
    expect(result.exitCode, result.stderr).toBe(0)
    expect(result.stdout).toContain('pnpm web')
    const path = join(cwd, 'demo/package.json')
    expect(JSON.parse(await readFile(path, 'utf8')).name).toBe('demo')
    await writeFile(join(cwd, 'demo/keep'), 'keep')
    expect((await run(['demo', '-y'])).exitCode).toBe(1)
    expect(await readFile(join(cwd, 'demo/keep'), 'utf8')).toBe('keep')
  })
  it('returns misuse for traversal and unknown flags', async () => {
    expect((await run(['../escape', '-y'])).exitCode).toBe(2)
    expect((await run(['demo', '--unknown'])).exitCode).toBe(2)
  })
})
