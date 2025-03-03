<script setup lang="ts">
import { computed } from 'vue'

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline'
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<ButtonProps>(), {
  variant: 'primary',
  loading: false,
  disabled: false,
  type: 'button',
  size: 'md',
})

const classes = computed(() => {
  const base = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50'

  const sizes = {
    sm: 'h-8 px-4 text-sm',
    md: 'h-10 px-6 text-base',
    lg: 'h-12 px-8 text-lg',
  }

  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50',
  }

  return `${base} ${sizes[props.size]} ${variants[props.variant]}`
})
</script>

<template>
  <button
    :type="type"
    :class="classes"
    :disabled="disabled || loading"
    :aria-disabled="disabled || loading"
  >
    <span v-if="loading" class="i-heroicons-arrow-path-20-solid mr-2 animate-spin" />
    <slot />
  </button>
</template>
