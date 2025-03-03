import { fileURLToPath } from 'node:url'
import Vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vite'
import Inspect from 'vite-plugin-inspect'
import VueTracer from '../src'

const r = (filepath: string) => fileURLToPath(new URL(filepath, import.meta.url))

export default defineConfig({
  plugins: [
    Vue(),
    VueTracer({
      resolveRecordEntryPath: false,
    }),
    Inspect(),
    UnoCSS(),
  ],
  resolve: {
    alias: {
      'vite-plugin-vue-tracer/client/record': r('../src/client/record.ts'),
      'vite-plugin-vue-tracer/client/listeners': r('../src/client/listeners.ts'),
      'vite-plugin-vue-tracer/client/overlay': r('../src/client/overlay.ts'),
      'vite-plugin-vue-tracer/client/vue-inspector-compat': r('../src/client/vue-inspector-compat.ts'),
    },
  },
})
