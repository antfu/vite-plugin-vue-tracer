import type { ElementTraceInfo } from './record'
import { createNanoEvents } from 'nanoevents'
import { customRef, ref, shallowRef } from 'vue'
import { findTraceAtPointer } from './record'

export * from './record'

export const lastMatchedElement = shallowRef<ElementTraceInfo | undefined>()

export const events = createNanoEvents<{
  hover: (info: ElementTraceInfo | undefined) => void
  click: (info: ElementTraceInfo, event: MouseEvent | PointerEvent) => void
  enable: () => void
  disable: () => void
}>()

export const isEnabled = customRef(() => {
  const value = ref(false)

  return {
    get() {
      return value.value
    },
    set(newValue) {
      if (newValue === value.value)
        return
      value.value = newValue
      if (newValue)
        events.emit('enable')
      else
        events.emit('disable')
    },
  }
})

// Setup listeners
if (typeof document !== 'undefined') {
  document.addEventListener('pointermove', (e) => {
    if (!isEnabled.value)
      return

    const result = findTraceAtPointer({ x: e.clientX, y: e.clientY })
    if (result?.el === lastMatchedElement.value?.el)
      return
    lastMatchedElement.value = result
    events.emit('hover', result)
  })

  document.addEventListener('click', (e) => {
    if (!isEnabled.value)
      return

    const result = findTraceAtPointer({ x: e.clientX, y: e.clientY })
    if (result) {
      // TODO: not working
      events.emit('click', result, e)
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()
      return false
    }
  }, true)
}
