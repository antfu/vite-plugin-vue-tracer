/// <reference types="vite/client" />
import type { DockClientScriptContext } from '@vitejs/devtools-kit/client'
import { events, getInternalStore, isEnabled } from 'vite-plugin-vue-tracer/client/listeners'
import { state } from 'vite-plugin-vue-tracer/client/overlay'

export default function clientScriptSetup(ctx: DockClientScriptContext): void {
  // Share ownership across module instances, as the page's click emitter does.
  const store = getInternalStore()
  const devtools = store.devtools ||= { bindings: new WeakMap() }
  const dockEvents = ctx.current.events
  devtools.bindings.get(dockEvents)?.()

  let offClick: (() => void) | undefined
  const stop = (): void => {
    offClick?.()
    offClick = undefined
    // An older dock's deactivation must leave the current selection running.
    if (devtools.stopActive !== stop)
      return
    devtools.stopActive = undefined
    isEnabled.value = false
    state.isVisible = false
    state.isEnabled = false
  }
  const activate = (): void => {
    // Return focus to the inspected page when activated from a popup.
    window.focus()
    devtools.stopActive?.()
    devtools.stopActive = stop
    offClick = events.on('click', (e) => {
      stop()
      ctx.rpc.call('vite:core:open-in-editor', `${e.pos[0]}:${e.pos[1]}:${e.pos[2]}`)
      ctx.docks.switchEntry(null)
    })
    isEnabled.value = true
    state.isVisible = true
  }
  const offActivate = dockEvents.on('entry:activated', activate)
  const offDeactivate = dockEvents.on('entry:deactivated', stop)
  devtools.bindings.set(dockEvents, () => {
    offActivate()
    offDeactivate()
    stop()
  })
  // Also support hosts that invoke the action after selecting its dock.
  if (ctx.current.isActive)
    activate()
}
