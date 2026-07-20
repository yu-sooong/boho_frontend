<script setup lang="ts">
defineProps<{
  status: '立案中' | '已廢止'
}>()
</script>

<template>
  <span
    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
    :class="
      status === '立案中'
        ? 'bg-primary-50 text-primary-800'
        : 'bg-gray-100 text-gray-600'
    "
  >
    {{ status }}
  </span>
</template>
