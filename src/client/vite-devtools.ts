/// <reference types="vite/client" />
import type { DockClientScriptContext } from '@vitejs/devtools-kit/client'
import { events, getInternalStore, isEnabled } from 'vite-plugin-vue-tracer/client/listeners'
import { state } from 'vite-plugin-vue-tracer/client/overlay'

interface SetupOptions {
  onPick: 'open-in-editor' | 'none' | 'host'
}

function createClientScriptSetup(options: SetupOptions): (ctx: DockClientScriptContext) => void {
  return function clientScriptSetup(ctx) {
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
        // The host shows its own UI for the pick and turns the tool off itself.
        // Without toggle actions there is no "on" state to keep, so end the pick.
        if (options.onPick === 'host' && 'setActionActive' in ctx.docks) {
          isEnabled.value = false
          return
        }
        stop()
        if (options.onPick === 'open-in-editor')
          ctx.rpc.call('vite:core:open-in-editor', `${e.pos[0]}:${e.pos[1]}:${e.pos[2]}`)
        // Hubs before devframe 1.3 have no toggle actions; there, clear the selection.
        ctx.docks.setActionActive?.(ctx.current.entryMeta.id, false) ?? ctx.docks.switchEntry(null)
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
}

export default createClientScriptSetup({ onPick: 'open-in-editor' })

/**
 * Picks without opening the editor, for hosts that handle the `click` event
 * from `vite-plugin-vue-tracer/client/listeners` themselves.
 */
export const pickOnly = createClientScriptSetup({ onPick: 'none' })

/**
 * Like {@link pickOnly}, but keeps the tool on after a pick until the host
 * turns it off.
 */
export const hostPick = createClientScriptSetup({ onPick: 'host' })
