import type { DockClientScriptContext } from '@vitejs/devtools-kit/client'
import { createNanoEvents } from 'nanoevents'
import { beforeEach, expect, it, vi } from 'vitest'
import setup, { hostPick, pickOnly } from '../src/client/vite-devtools'

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
let focus: ReturnType<typeof vi.fn>
beforeEach(() => {
  focus = vi.fn()
  vi.stubGlobal('window', { focus })
  clicks = createNanoEvents()
  tracer.events.on.mockImplementation(clicks.on.bind(clicks))
  tracer.store = {}
  tracer.isEnabled.value = false
})

function context() {
  const events = createNanoEvents()
  const call = vi.fn()
  const switchEntry = vi.fn(() => events.emit('entry:deactivated'))
  const ctx = {
    current: { events, entryMeta: { id: 'vue-tracer' } },
    rpc: { call },
    docks: { switchEntry },
  } as unknown as DockClientScriptContext
  return { ctx, events, call, switchEntry }
}

// A hub with toggle actions (devframes/devframe#469).
function toggleContext() {
  const c = context()
  const setActionActive = vi.fn(async () => {
    c.events.emit('entry:deactivated')
    return true
  })
  Object.assign(c.ctx.docks, { setActionActive })
  return { ...c, setActionActive }
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

it('focuses the inspected page on activation', () => {
  const c = context()
  setup(c.ctx)
  expect(focus).not.toHaveBeenCalled()
  c.events.emit('entry:activated')
  expect(focus).toHaveBeenCalledOnce()
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

it('turns the toggle action off after a pick instead of clearing the selection', () => {
  const c = toggleContext()
  setup(c.ctx)
  for (let cycle = 0; cycle < 2; cycle++) {
    c.events.emit('entry:activated')
    expect(tracer.isEnabled.value).toBe(true)
    clicks.emit('click', { pos: ['Component.vue', 10, 2] })
    expect(c.call).toHaveBeenCalledTimes(cycle + 1)
    expect(c.setActionActive).toHaveBeenLastCalledWith('vue-tracer', false)
    expect(tracer.isEnabled.value).toBe(false)
  }
  expect(c.switchEntry).not.toHaveBeenCalled()
})

it('stops a toggle action when the hub turns it off', () => {
  const c = toggleContext()
  setup(c.ctx)
  c.events.emit('entry:activated')
  c.events.emit('entry:deactivated')
  clicks.emit('click', { pos: ['Component.vue', 10, 2] })
  expect(c.call).not.toHaveBeenCalled()
  expect(c.setActionActive).not.toHaveBeenCalled()
  expect(tracer.isEnabled.value).toBe(false)
})

it.each([
  ['with', toggleContext],
  ['without', context],
])('leaves the pick to the host in pick-only mode %s toggle actions', (_, create) => {
  const c = create()
  pickOnly(c.ctx)
  c.events.emit('entry:activated')
  clicks.emit('click', { pos: ['Component.vue', 10, 2] })
  expect(c.call).not.toHaveBeenCalled()
  expect(tracer.isEnabled.value).toBe(false)
  expect(clicks.events.click).toHaveLength(0)
})

it('keeps the tool on after a pick until the host turns it off', () => {
  const c = toggleContext()
  hostPick(c.ctx)
  c.events.emit('entry:activated')
  clicks.emit('click', { pos: ['Component.vue', 10, 2] })
  // The overlay stays on the picked element but stops following the mouse.
  expect(tracer.isEnabled.value).toBe(false)
  expect(tracer.state.isVisible).toBe(true)
  expect(c.call).not.toHaveBeenCalled()
  expect(c.setActionActive).not.toHaveBeenCalled()

  // The host may pick again before turning the tool off.
  tracer.isEnabled.value = true
  clicks.emit('click', { pos: ['Component.vue', 12, 4] })
  expect(tracer.isEnabled.value).toBe(false)
  expect(c.setActionActive).not.toHaveBeenCalled()

  c.events.emit('entry:deactivated')
  expect(tracer.state).toMatchObject({ isVisible: false, isEnabled: false })
  expect(clicks.events.click).toHaveLength(0)

  c.events.emit('entry:activated')
  expect(tracer.isEnabled.value).toBe(true)
  expect(tracer.state.isVisible).toBe(true)
})

it('ends the pick in host mode without toggle actions', () => {
  const c = context()
  hostPick(c.ctx)
  c.events.emit('entry:activated')
  clicks.emit('click', { pos: ['Component.vue', 10, 2] })
  expect(c.call).not.toHaveBeenCalled()
  expect(c.switchEntry).toHaveBeenCalledOnce()
  expect(tracer.state.isVisible).toBe(false)
})
