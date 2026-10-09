import type { DockClientScriptContext } from '@vitejs/devtools-kit/client'
import { createNanoEvents } from 'nanoevents'
import { beforeEach, expect, it, vi } from 'vitest'
import setup from '../src/client/vite-devtools'

const tracer = vi.hoisted(() => ({
  events: { on: vi.fn() },
  isEnabled: { value: false },
  state: { isVisible: false, isEnabled: false },
  store: {},
}))
vi.mock('vite-plugin-vue-tracer/client/listeners', () => ({
  events: tracer.events,
  isEnabled: tracer.isEnabled,
  getInternalStore: () => tracer.store,
}))
vi.mock('vite-plugin-vue-tracer/client/overlay', () => ({ state: tracer.state }))

let clicks: ReturnType<typeof createNanoEvents>
beforeEach(() => {
  clicks = createNanoEvents()
  tracer.events.on.mockImplementation(clicks.on.bind(clicks))
  tracer.store = {}
  tracer.isEnabled.value = false
})

function context() {
  const events = createNanoEvents()
  const call = vi.fn()
  const switchEntry = vi.fn(() => events.emit('entry:deactivated'))
  const ctx = { current: { events }, rpc: { call }, docks: { switchEntry } } as unknown as DockClientScriptContext
  return { ctx, events, call, switchEntry }
}

it.each([true, false])('handles one element click per activation with repeated setup: %s', (repeatSetup) => {
  const c = context()
  for (let cycle = 0; cycle < 3; cycle++) {
    if (cycle === 0 || repeatSetup)
      setup(c.ctx)
    c.events.emit('entry:activated')
    clicks.emit('click', { pos: ['Component.vue', 10, 2] })
    expect(c.call).toHaveBeenCalledTimes(cycle + 1)
    expect(c.switchEntry).toHaveBeenCalledTimes(cycle + 1)
    expect(clicks.events.click).toHaveLength(0)
  }
})

it('removes the click handler when selection is cancelled', () => {
  const c = context()
  setup(c.ctx)
  c.events.emit('entry:activated')
  c.events.emit('entry:deactivated')
  clicks.emit('click', { pos: ['Component.vue', 10, 2] })
  expect(c.call).not.toHaveBeenCalled()
  expect(tracer.isEnabled.value).toBe(false)
})

it('replaces an old context on the same dock without retaining its RPC connection', () => {
  const old = context()
  const current = context()
  current.ctx.current.events = old.ctx.current.events
  setup(old.ctx)
  old.events.emit('entry:activated')
  setup(current.ctx)
  old.events.emit('entry:activated')
  clicks.emit('click', { pos: ['Component.vue', 10, 2] })
  expect(old.call).not.toHaveBeenCalled()
  expect(current.call).toHaveBeenCalledOnce()
})

it('keeps a newer dock active when an old dock deactivates', () => {
  const old = context()
  const current = context()
  setup(old.ctx)
  setup(current.ctx)
  old.events.emit('entry:activated')
  current.events.emit('entry:activated')
  old.events.emit('entry:deactivated')
  expect(tracer.isEnabled.value).toBe(true)
  clicks.emit('click', { pos: ['Component.vue', 10, 2] })
  expect(old.call).not.toHaveBeenCalled()
  expect(current.call).toHaveBeenCalledOnce()
})

it('supports invoking setup after the host has already selected the dock', () => {
  const c = context()
  Object.assign(c.ctx.current, { isActive: true })
  setup(c.ctx)
  setup(c.ctx)
  clicks.emit('click', { pos: ['Component.vue', 10, 2] })
  expect(c.call).toHaveBeenCalledOnce()
})

it('shares subscription ownership across separately loaded script modules', async () => {
  const c = context()
  setup(c.ctx)
  vi.resetModules()
  const { default: reloadedSetup } = await import('../src/client/vite-devtools')
  reloadedSetup(c.ctx)
  c.events.emit('entry:activated')
  clicks.emit('click', { pos: ['Component.vue', 10, 2] })
  expect(c.call).toHaveBeenCalledOnce()
  expect(c.events.events['entry:activated']).toHaveLength(1)
})
