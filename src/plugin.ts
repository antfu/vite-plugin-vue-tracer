import type {} from '@vitejs/devtools-kit'
import type { Plugin } from 'vite'
import process from 'node:process'
import { walk } from 'estree-walker'
import { resolveModulePath } from 'exsolve'
import MagicString from 'magic-string'
import { dirname, isAbsolute, relative } from 'pathe'
import { SourceMapConsumer } from 'source-map-js'

const functions = [
  'h',
  '_createElementVNode',
  '_createElementBlock',
  '_createBlock',
  '_createVNode',
  '_createStaticVNode',
]

const testRe = new RegExp(`\\b(?:${functions.join('|')})\\(`)

export interface VueTracerOptions {
  /**
   * Enable this plugin or not, or only enable in certain environment.
   *
   * @default 'dev'
   */
  enabled?: boolean | 'dev' | 'prod'

  /**
   * Resolve the record entry path to relative path.
   * Normally, it should be true.
   *
   * @default true
   */
  resolveRecordEntryPath?: boolean

  /**
   * Enable Vite DevTools integration.
   *
   * @default false
   */
  viteDevtools?: boolean
}

/**
 * Resolve the module specifier used to import the tracer's `record` entry from
 * within a transformed module.
 *
 * For real files we compute a relative path from the module's directory. But
 * virtual modules (e.g. Nuxt's `virtual:nuxt:...` layouts, or `\0`-prefixed
 * Rollup virtuals) have no real filesystem base, so `dirname(id)` collapses to
 * `.` and the relative import cannot be resolved from them. Vite 7 papered over
 * this by falling back to the CWD; Vite 8 no longer does, so the injected
 * import fails. For those IDs we fall back to the fully-resolved absolute path
 * of the record module, which resolves regardless of the module's base.
 * See https://github.com/nuxt/devtools/issues/1051.
 */
export function getRecordImportPath(
  id: string,
  pathRecordDist: string,
  resolveRecordEntryPath: boolean,
): string {
  if (!resolveRecordEntryPath)
    return 'vite-plugin-vue-tracer/client/record'
  // Virtual modules have no real filesystem base to be relative to.
  if (id.startsWith('virtual:') || id.startsWith('\0'))
    return pathRecordDist
  let related = relative(dirname(id), pathRecordDist)
  if (!related.startsWith('./') && !isAbsolute(related))
    related = `./${related}`
  return related
}

export function VueTracer(options?: VueTracerOptions): Plugin | undefined {
  let {
    enabled = 'dev',
    resolveRecordEntryPath = true,
    viteDevtools = false,
  } = options || {}

  if (enabled === false)
    return

  const pathRecordDist = resolveModulePath('vite-plugin-vue-tracer/client/record', { from: import.meta.url })
  const getRecordPath = (id: string): string =>
    getRecordImportPath(id, pathRecordDist, resolveRecordEntryPath)

  return {
    name: 'vite-plugin-vue-tracer',
    enforce: 'post',
    configResolved(config) {
      if (enabled === 'dev')
        enabled = config.command === 'serve'
      else if (enabled === 'prod')
        enabled = config.command === 'build'
    },
    transform(code, id) {
      if (!enabled)
        return

      if (this.environment.name !== 'client')
        return

      // Only transform Vue SFC
      if (!code.includes('_sfc_render('))
        return

      // Only transform Vue compiled template
      if (!testRe.test(code))
        return

      // Already transformed
      if (code.includes('_tracer('))
        return

      function offsetToPos(index: number): { line: number, column: number } {
        const lines = code.slice(0, index).split('\n')
        return {
          line: lines.length,
          column: lines.at(-1)!.length,
        }
      }

      const map = this.getCombinedSourcemap()
      const consumer = new SourceMapConsumer(map as any)

      const s = new MagicString(code)
      const ast = this.parse(code)
      let hit = false

      walk(ast as any, {
        enter(node) {
          if (node.type !== 'CallExpression' || node.callee.type !== 'Identifier')
            return
          if (!functions.includes(node.callee.name))
            return

          const { start, end } = node as any as { start: number, end: number }
          const pos = offsetToPos(start)
          const original = consumer.originalPositionFor(pos)
          if (original.source === null)
            return

          hit = true
          s.appendLeft(start, `_tracer(${original.line},${original.column},`)
          s.appendRight(end, `)`)
        },
      })

      if (!hit)
        return

      const related = relative(process.cwd(), id)
      s.prepend(`import { recordPosition as _tracerRecordPosition } from ${JSON.stringify(getRecordPath(id))}\n`)
      s.append(`\nfunction _tracer(line, column, vnode) { return _tracerRecordPosition(${JSON.stringify(related)}, line, column, vnode) }\n`)
      return {
        code: s.toString(),
        map: s.generateMap({ hires: true }),
      }
    },

    // Vite DevTools integration
    ...viteDevtools
      ? {
          devtools: {
            setup(ctx) {
              ctx.docks.register({
                id: 'vue-tracer',
                title: 'Vue Tracer',
                icon: 'ph:crosshair-simple-duotone',
                type: 'action',
                action: {
                  importFrom: 'vite-plugin-vue-tracer/client/vite-devtools',
                  importName: 'default',
                },
              })
            },
          },
        }
      : {},
  }
}
