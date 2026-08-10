import { describe, expect, it } from 'vitest'
import { getRecordImportPath } from '../src/utils'

const RECORD_DIST = '/project/node_modules/vite-plugin-vue-tracer/dist/client/record.mjs'
const BARE = 'vite-plugin-vue-tracer/client/record'

describe('getRecordImportPath', () => {
  it('resolves a relative path for real filesystem modules', () => {
    const result = getRecordImportPath('/project/src/App.vue', RECORD_DIST, true)
    expect(result).toBe('./../node_modules/vite-plugin-vue-tracer/dist/client/record.mjs')
  })

  it('uses the bare specifier when resolveRecordEntryPath is disabled', () => {
    expect(getRecordImportPath('/project/src/App.vue', RECORD_DIST, false)).toBe(BARE)
  })

  it('uses the full resolved path for Nuxt virtual layout modules (#1051)', () => {
    const id = 'virtual:nuxt:.nuxt%2Flayouts.default.abcdef.vue'
    expect(getRecordImportPath(id, RECORD_DIST, true)).toBe(RECORD_DIST)
  })

  it('uses the full resolved path for \\0-prefixed Rollup virtual modules', () => {
    expect(getRecordImportPath('\0some-virtual-module', RECORD_DIST, true)).toBe(RECORD_DIST)
  })
})
