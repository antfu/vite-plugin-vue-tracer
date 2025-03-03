<script setup lang="ts">
import { computed } from 'vue'

export interface GridProps {
  columns?: 2 | 3 | 4
  gap?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<GridProps>(), {
  columns: 4,
  gap: 'md',
})

const gridClass = computed(() => {
  const cols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }

  const gaps = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
  }

  return `grid ${cols[props.columns]} ${gaps[props.gap]}`
})
</script>

<template>
  <div :class="gridClass">
    <slot />
  </div>
</template>
