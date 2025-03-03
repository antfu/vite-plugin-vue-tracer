<script setup lang="ts">
export interface CheckboxProps {
  modelValue: boolean
  label: string
  disabled?: boolean
}

withDefaults(defineProps<CheckboxProps>(), {
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>

<template>
  <label class="flex items-center space-x-2">
    <input
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
      @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    >
    <span class="text-sm text-gray-700 dark:text-gray-200">{{ label }}</span>
  </label>
</template>
