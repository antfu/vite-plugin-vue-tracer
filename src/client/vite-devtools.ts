/// <reference types="vite/client" />
import type { ImportScriptContext } from '@vitejs/devtools-kit/client'
import { events, isEnabled } from 'vite-plugin-vue-tracer/client/listeners'
import { state } from 'vite-plugin-vue-tracer/client/overlay'

export default function enable(ctx: ImportScriptContext): void {
  events.on('click', (e) => {
    const base = import.meta.env?.BASE_URL || '/'
    fetch(`${base}__open-in-editor?file=${e.pos[0]}:${e.pos[1]}:${e.pos[2]}`)
    isEnabled.value = false
    state.isVisible = false
  })

  isEnabled.value = !isEnabled.value
  state.isVisible = isEnabled.value
  ctx.hidePanel()
  ctx.dockState = isEnabled.value ? 'active' : 'inactive'
}
