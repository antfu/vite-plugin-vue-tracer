/// <reference types="vite/client" />
import type { DockClientScriptContext } from '@vitejs/devtools-kit/client'
import { events, getInternalStore, isEnabled } from 'vite-plugin-vue-tracer/client/listeners'
import { state } from 'vite-plugin-vue-tracer/client/overlay'

// `setActionActive` ships with toggle actions (devframes/devframe#469).
type Docks = DockClientScriptContext['docks'] & {
  setActionActive?: (id: string, active: boolean) => Promise<boolean>
}

interface SetupOptions {
  /** Open the picked element in the editor. */
  openInEditor: boolean
}

function createClientScriptSetup(options: SetupOptions): (ctx: DockClientScriptContext) => void {
  return function clientScriptSetup(ctx) {
    // Share ownership across module instances, as the page's click emitter does.
    const store = getInternalStore()
    const devtools = store.devtools ||= { bindings: new WeakMap() }
    const dockEvents = ctx.current.events
    devtools.bindings.get(dockEvents)?.()

    const docks = ctx.docks as Docks
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
        if (options.openInEditor)
          ctx.rpc.call('vite:core:open-in-editor', `${e.pos[0]}:${e.pos[1]}:${e.pos[2]}`)
        // Hubs with toggle actions restore the panel the tool hid.
        docks.setActionActive?.(ctx.current.entryMeta.id, false) ?? docks.switchEntry(null)
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

export default createClientScriptSetup({ openInEditor: true })

/**
 * Picks without opening the editor, for hosts that handle the `click` event
 * from `vite-plugin-vue-tracer/client/listeners` themselves.
 */
export const pickOnly = createClientScriptSetup({ openInEditor: false })
