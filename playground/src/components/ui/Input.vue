<script setup lang="ts">
export interface InputProps {
  type?: 'text' | 'email' | 'number'
  modelValue: string | number
  label?: string
  placeholder?: string
  error?: string
  disabled?: boolean
}

withDefaults(defineProps<InputProps>(), {
  type: 'text',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()
</script>

<template>
  <div class="space-y-2">
    <label
      v-if="label"
      :for="label"
      class="text-sm font-medium text-gray-700 dark:text-gray-200"
    >
      {{ label }}
    </label>
    <input
      :id="label"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :aria-invalid="!!error"
      :aria-errormessage="error ? `${label}-error` : undefined"
      class="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    >
    <p
      v-if="error"
      :id="`${label}-error`"
      class="text-sm text-red-600"
    >
      {{ error }}
    </p>
  </div>
</template>
