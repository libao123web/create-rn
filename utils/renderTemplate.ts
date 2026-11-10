import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { CreateOptions } from './resolveOptions.js'

export async function renderTemplate(
  source: string,
  target: string,
  options: CreateOptions,
): Promise<void> {
  const values: Record<string, string> = {
    __CREATE_RN_PROJECT_NAME__: options.projectName,
    __CREATE_RN_SLUG__: options.slug,
    __CREATE_RN_APP_NAME__: options.appName,
    __CREATE_RN_APP_ID__: options.appId,
    __CREATE_RN_SCHEME__: options.scheme,
  }
  async function visit(from: string, to: string): Promise<void> {
    await mkdir(to, { recursive: true })
    for (const entry of await readdir(from, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) throw new Error('模板不能包含符号链接')
      const input = join(from, entry.name)
      const output = join(to, entry.name === '_gitignore' ? '.gitignore' : entry.name)
      if (entry.isDirectory()) {
        await visit(input, output)
      } else if (entry.isFile()) {
        const text = (await readFile(input, 'utf8')).replace(
          /(['"])(__CREATE_RN_[A-Z_]+__)\1/g,
          (_match, _quote: string, key: string) => {
            if (!(key in values)) throw new Error(`未知模板字段：${key}`)
            return JSON.stringify(values[key])
          },
        )
        if (/__CREATE_RN_[A-Z_]+__/.test(text)) throw new Error(`模板字段未替换：${entry.name}`)
        await writeFile(output, text, 'utf8')
      } else {
        throw new Error(`模板包含不支持的文件：${entry.name}`)
      }
    }
  }
  await visit(source, target)
  JSON.parse(await readFile(join(target, 'package.json'), 'utf8'))
  await readFile(join(target, 'app.config.ts'), 'utf8')
}
