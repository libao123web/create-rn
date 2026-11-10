import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execa } from 'execa'

const repository = fileURLToPath(new URL('../', import.meta.url))
const root = await mkdtemp(join(tmpdir(), 'create-rn-package-'))
assert.equal(dirname(root), resolve(tmpdir()))
assert.ok(basename(root).startsWith('create-rn-package-'))

try {
  await execa('pnpm', ['build'], { cwd: repository, stdio: 'inherit' })
  const { stdout } = await execa(
    'npm',
    ['pack', '--ignore-scripts', '--json', '--pack-destination', root],
    { cwd: repository },
  )
  const [manifest] = JSON.parse(stdout)
  assert.ok(manifest.files.some((file) => file.path === 'templates/expo-tamagui/_gitignore'))
  assert.ok(manifest.files.some((file) => file.path === 'templates/expo-tamagui/.env.example'))
  assert.ok(!manifest.files.some((file) => /node_modules|\.superpowers|__test__/.test(file.path)))
  const tarball = join(root, manifest.filename)
  const installer = join(root, 'installer')
  const cwd = join(root, 'empty directory with spaces')
  await mkdir(installer)
  await mkdir(cwd)
  await execa(
    'npm',
    ['install', '--prefix', installer, '--ignore-scripts', '--no-audit', '--no-fund', tarball],
    { cwd: root },
  )
  const bin = join(
    installer,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'create-rn.cmd' : 'create-rn',
  )
  await execa(
    bin,
    [
      'portable-app',
      '--yes',
      '--no-git',
      '--app-name',
      'Portable "应用"',
      '--app-id',
      'cn.example.portable',
      '-m',
      'npm',
    ],
    { cwd },
  )
  const project = join(cwd, 'portable-app')
  assert.ok(!(await readdir(cwd)).includes('package.json'))
  assert.equal(
    JSON.parse(await readFile(join(project, 'package.json'), 'utf8')).name,
    'portable-app',
  )
  const config = await readFile(join(project, 'app.config.ts'), 'utf8')
  assert.ok(config.includes('"cn.example.portable"'))
  assert.ok(!config.includes('__CREATE_RN_'))
  await readFile(join(project, '.gitignore'))
  await readFile(join(project, '.env.example'))
  await execa(
    'npm',
    ['exec', '--yes', `--package=${tarball}`, '--', 'create-rn', 'npx-app', '--yes', '--no-git'],
    { cwd },
  )
  assert.equal(
    JSON.parse(await readFile(join(cwd, 'npx-app/package.json'), 'utf8')).name,
    'npx-app',
  )
  console.log(
    `PASS: tarball contains ${manifest.files.length} files; installed bin and npm exec create standalone apps from an empty directory with spaces.`,
  )
} finally {
  await rm(root, { recursive: true, force: true })
}
