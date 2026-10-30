import type { DevToolsViewAction } from '@vitejs/devtools-kit'
import type { Plugin } from 'vite'
import process from 'node:process'
import { walk } from 'estree-walker'
import { resolveModulePath } from 'exsolve'
import MagicString from 'magic-string'
import { relative } from 'pathe'
import { SourceMapConsumer } from 'source-map-js'
import { searchForWorkspaceRoot } from 'vite'
import { getRecordImportPath } from './utils'

const functions = [
  'h',
  '_createElementVNode',
  '_createElementBlock',
  '_createBlock',
  '_createVNode',
  '_createStaticVNode',
]

const DOCK_ID = 'vue-tracer'

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
   * Enable Vite DevTools integration: an "Inspect Vue component" dock button
   * that picks an element on the page.
   *
   * @default false
   */
  viteDevtools?: boolean | VueTracerViteDevtoolsOptions
}

export interface VueTracerViteDevtoolsOptions {
  /**
   * What to do with the picked element.
   *
   * - `'open-in-editor'`: open its source in the editor.
   * - `'none'`: only end the pick. Use it when you handle the `click` event
   *   from `vite-plugin-vue-tracer/client/listeners` yourself.
   *
   * @default 'open-in-editor'
   */
  onPick?: 'open-in-editor' | 'none'
}

export function VueTracer(options?: VueTracerOptions): Plugin | undefined {
  let {
    enabled = 'dev',
    resolveRecordEntryPath = true,
    viteDevtools = false,
  } = options || {}
  const devtoolsOptions = viteDevtools === true ? {} : viteDevtools

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

      const workspaceRoot = searchForWorkspaceRoot(process.cwd())
      const related = relative(workspaceRoot, id)
      s.prepend(`import { recordPosition as _tracerRecordPosition } from ${JSON.stringify(getRecordPath(id))}\n`)
      s.append(`\nfunction _tracer(line, column, vnode) { return _tracerRecordPosition(${JSON.stringify(related)}, line, column, vnode) }\n`)
      return {
        code: s.toString(),
        map: s.generateMap({ hires: true }),
      }
    },

    // Vite DevTools integration
    ...devtoolsOptions
      ? {
          devtools: {
            setup(ctx) {
              const { onPick = 'open-in-editor' } = devtoolsOptions
              const entry: DevToolsViewAction = {
                id: DOCK_ID,
                title: 'Inspect Vue component',
                description: onPick === 'none'
                  ? 'Pick an element on the page to inspect its Vue component'
                  : 'Pick an element on the page to open its Vue component in the editor',
                icon: 'ph:crosshair-simple-duotone',
                type: 'action',
                toggle: true,
                action: {
                  importFrom: 'vite-plugin-vue-tracer/client/vite-devtools',
                  importName: onPick === 'none' ? 'pickOnly' : 'default',
                },
              }
              ctx.docks.register(entry)
              // Activating the dock from the server reaches every connected page.
              // Avoid Alt: on macOS it changes `KeyboardEvent.key`, which the hub matches.
              ctx.commands?.register({
                id: 'vue-tracer:toggle-inspector',
                title: 'Toggle Vue component inspector',
                icon: entry.icon,
                keybindings: [{ key: 'Mod+Shift+X' }],
                handler: () => ctx.docks.activate(DOCK_ID),
              })
            },
          },
        }
      : {},
  }
}
