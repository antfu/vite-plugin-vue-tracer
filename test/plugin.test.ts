import type { Plugin } from 'vite'
import type { VueTracerOptions } from '../src'
import { expect, it, vi } from 'vitest'
import { VueTracer } from '../src'

vi.mock('exsolve', () => ({ resolveModulePath: (id: string) => id }))

function setupDevtools(options: VueTracerOptions) {
  const ctx = {
    docks: { register: vi.fn(), activate: vi.fn() },
    commands: { register: vi.fn() },
  }
  const plugin = VueTracer(options) as Plugin
  ;(plugin.devtools?.setup as (ctx: unknown) => void)?.(ctx)
  return ctx
}

it('does not integrate with Vite DevTools by default', () => {
  expect((VueTracer() as Plugin).devtools).toBeUndefined()
})

it('registers a toggle dock action that opens the editor', () => {
  const ctx = setupDevtools({ viteDevtools: true })
  expect(ctx.docks.register).toHaveBeenCalledWith(expect.objectContaining({
    id: 'vue-tracer',
    type: 'action',
    toggle: true,
    title: 'Inspect Vue component',
    description: expect.any(String),
    action: { importFrom: 'vite-plugin-vue-tracer/client/vite-devtools', importName: 'default' },
  }))
})

it.each([
  ['none', 'pickOnly'],
  ['host', 'hostPick'],
] as const)('lets the host handle picks with onPick: %s', (onPick, importName) => {
  const ctx = setupDevtools({ viteDevtools: { onPick } })
  expect(ctx.docks.register.mock.calls[0][0].action.importName).toBe(importName)
})

it('registers a command that toggles the dock action', () => {
  const ctx = setupDevtools({ viteDevtools: {} })
  const command = ctx.commands.register.mock.calls[0][0]
  expect(command.keybindings).toEqual([{ key: 'Mod+Shift+X' }])
  command.handler()
  expect(ctx.docks.activate).toHaveBeenCalledWith('vue-tracer')
})
