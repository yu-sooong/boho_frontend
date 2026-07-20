<template>
  <svg
    :class="svgClass"
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <!-- 左側主幹：底部弧形切角，為小芽留出空間 -->
    <path
      d="M 18,8 L 38,8 L 38,48 A 30,30 0 0,1 18,62 Z"
      :class="bColorClass"
      class="transition-colors duration-300"
    />

    <!-- 右側圓肚：外圓 D 形 + 內孔挖空 -->
    <path
      d="M 38,22 L 54,22 A 34,34 0 0,1 88,56 A 34,34 0 0,1 54,90 L 38,90 L 38,68 L 54,68 A 12,12 0 0,0 66,56 A 12,12 0 0,0 54,44 L 38,44 Z"
      :class="bColorClass"
      class="transition-colors duration-300"
    />

    <!-- 底部小芽：莖幹 + 左右葉片，右葉刻意穿入字體製造「萌芽破殼」感 -->
    <g :class="sproutColorClass" class="transition-colors duration-300">
      <!-- 莖幹 -->
      <path d="M 26,74 L 30,74 L 30,90 L 26,90 Z" fill="currentColor" />
      <!-- 左葉 -->
      <path d="M 27,74 C 14,74 10,63 12,56 C 18,56 26,64 27,74 Z" fill="currentColor" />
      <!-- 右葉（向上延伸穿過 b，象徵突破成長） -->
      <path d="M 29,72 C 42,65 46,52 45,44 C 35,46 28,59 29,72 Z" fill="currentColor" />
    </g>
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  svgClass?: string
  bColorClass?: string
  sproutColorClass?: string
}>(), {
  svgClass: 'w-10 h-10',
  bColorClass: 'fill-slate-800',
  sproutColorClass: 'text-emerald-500',
})
</script>
