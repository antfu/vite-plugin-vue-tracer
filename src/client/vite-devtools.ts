/// <reference types="vite/client" />
import type { DockClientScriptContext } from '@vitejs/devtools-kit/client'
import { events, isEnabled } from 'vite-plugin-vue-tracer/client/listeners'
import { state } from 'vite-plugin-vue-tracer/client/overlay'

export default function enable(ctx: DockClientScriptContext): void {
  events.on('click', (e) => {
    ctx.rpc['vite:core:open-in-editor'](`${e.pos[0]}:${e.pos[1]}:${e.pos[2]}`)
    state.isVisible = false
  })

  isEnabled.value = !isEnabled.value
  state.isVisible = isEnabled.value

  ctx.docks.switchEntry(isEnabled.value ? ctx.current.entryMeta.id : null)
}
