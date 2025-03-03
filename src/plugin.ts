import type { Plugin } from 'vite'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { walk } from 'estree-walker'
import MagicString from 'magic-string'
import { dirname, relative } from 'pathe'
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
}

export function VueTracer(options?: VueTracerOptions): Plugin | undefined {
  let {
    enabled = 'dev',
    resolveRecordEntryPath = true,
  } = options || {}

  if (enabled === false)
    return

  const pathRecordDist = fileURLToPath(import.meta.resolve('vite-plugin-vue-tracer/client/record'))
  const getRecordPath = (id: string): string => {
    if (!resolveRecordEntryPath)
      return 'vite-plugin-vue-tracer/client/record'
    return relative(dirname(id), pathRecordDist)
  }

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
      if (!code.match(testRe))
        return

      // Already transformed
      if (code.includes('_tracer('))
        return

      function offsetToPos(index: number): { line: number, column: number } {
        const lines = code.slice(0, index).split('\n')
        return {
          line: lines.length,
          column: lines[lines.length - 1].length,
        }
      }

      const map = this.getCombinedSourcemap()
      const consumer = new SourceMapConsumer(map as any)

      const s = new MagicString(code)
      const ast = this.parse(code)
      let hit = false

      walk(ast, {
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
  }
}
