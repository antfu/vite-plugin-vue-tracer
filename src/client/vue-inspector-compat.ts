import { events, isEnabled } from './listeners'

export * from './listeners'

export interface VueInspectorClient {
  enabled: boolean
  enable: () => void
  disable: () => void
  toggleEnabled: () => void
  onEnabled: () => void
  onDisabled: () => void

  openInEditor: (url: URL) => void
  onUpdated: () => void
}

export const inspector: VueInspectorClient = {
  get enabled() {
    return isEnabled.value
  },
  set enabled(value) {
    isEnabled.value = value
  },
  toggleEnabled() {
    isEnabled.value = !isEnabled.value
  },
  enable() {
    isEnabled.value = true
  },
  disable() {
    isEnabled.value = false
  },
  openInEditor() {},
  onEnabled() {},
  onDisabled() {},
  onUpdated() {},
}

events.on('enable', () => {
  inspector.onEnabled()
})

events.on('disable', () => {
  inspector.onDisabled()
})
