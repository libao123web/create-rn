import { defineConfig } from 'rolldown'

export default defineConfig({
  input: 'index.ts',
  output: {
    format: 'esm',
    file: 'bundle.js',
    banner: '#!/usr/bin/env node\n',
    codeSplitting: false,
  },
  platform: 'node',
})
