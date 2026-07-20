<script setup lang="ts">
withDefaults(
  defineProps<{
    active?: boolean
    size?: 'sm' | 'md'
  }>(),
  { active: false, size: 'sm' },
)
</script>

<template>
  <span
    class="inline-flex items-center rounded-md border whitespace-nowrap"
    :class="[
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
      active
        ? 'border-primary-600 bg-primary-50 text-primary-700 font-medium'
        : 'border-gray-300 text-gray-600',
    ]"
  >
    <slot />
  </span>
</template>
