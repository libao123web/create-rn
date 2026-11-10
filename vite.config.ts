import { defineConfig } from 'vite-plus'

export default defineConfig({
  staged: { '*.{js,ts,json}': ['vp fmt', 'vp lint --fix'] },
  fmt: {
    semi: false,
    singleQuote: true,
    printWidth: 100,
    ignorePatterns: ['pnpm-lock.yaml', 'bundle.js'],
  },
  lint: {
    categories: { correctness: 'error' },
    ignorePatterns: ['bundle.js', 'templates/**'],
    options: { typeAware: true, typeCheck: true },
  },
  test: { include: ['__test__/**/*.spec.ts'] },
})
