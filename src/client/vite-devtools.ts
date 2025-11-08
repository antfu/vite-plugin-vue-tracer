/// <reference types="vite/client" />
import type { DockClientScriptContext } from '@vitejs/devtools-kit/client'
import { events, isEnabled } from 'vite-plugin-vue-tracer/client/listeners'
import { state } from 'vite-plugin-vue-tracer/client/overlay'

export default function clientScriptSetup(ctx: DockClientScriptContext): void {
  ctx.current.events.on('entry:activated', () => {
    events.on('click', (e) => {
      ctx.rpc['vite:core:open-in-editor'](`${e.pos[0]}:${e.pos[1]}:${e.pos[2]}`)
      state.isVisible = false
      state.isEnabled = false
      ctx.docks.switchEntry(null)
    })

    isEnabled.value = true
    state.isVisible = true
  })

  ctx.current.events.on('entry:deactivated', () => {
    isEnabled.value = false
    state.isVisible = false
  })
}
