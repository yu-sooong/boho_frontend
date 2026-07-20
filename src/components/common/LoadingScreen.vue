<template>
  <div class="loading-screen fixed inset-0 z-[100] flex items-center justify-center bg-white">
    <!-- 直接內嵌 SVG，才能對小芽單獨施加動畫 -->
    <svg class="logo-in w-20 h-20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- b 主體（靜止不動） -->
      <path
        d="M 18,8 L 38,8 L 38,48 A 30,30 0 0,1 18,62 Z"
        class="fill-slate-800"
      />
      <path
        d="M 38,22 L 54,22 A 34,34 0 0,1 88,56 A 34,34 0 0,1 54,90 L 38,90 L 38,68 L 54,68 A 12,12 0 0,0 66,56 A 12,12 0 0,0 54,44 L 38,44 Z"
        class="fill-slate-800"
      />

      <!-- 小芽：整體以莖底為軸左右搖擺（wind sway） -->
      <g class="sprout-sway" style="transform-box: fill-box; transform-origin: bottom center;">
        <!-- 莖幹 -->
        <path d="M 26,74 L 30,74 L 30,90 L 26,90 Z" class="fill-emerald-500" />
        <!-- 左葉 -->
        <path
          d="M 27,74 C 14,74 10,63 12,56 C 18,56 26,64 27,74 Z"
          class="fill-emerald-500 leaf-left"
          style="transform-box: fill-box; transform-origin: right bottom;"
        />
        <!-- 右葉（穿入 b 字，象徵突破） -->
        <path
          d="M 29,72 C 42,65 46,52 45,44 C 35,46 28,59 29,72 Z"
          class="fill-emerald-500 leaf-right"
          style="transform-box: fill-box; transform-origin: left bottom;"
        />
      </g>
    </svg>
  </div>
</template>

<style scoped>
/* ── 整體 Logo 入場 ── */
.logo-in {
  animation: logo-in 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
}
@keyframes logo-in {
  from { opacity: 0; transform: scale(0.82); }
  to   { opacity: 1; transform: scale(1); }
}

/* ── 小芽整體擺動（像被風吹） ── */
.sprout-sway {
  animation: sprout-sway 2.4s ease-in-out 0.7s infinite;
}
@keyframes sprout-sway {
  0%   { transform: rotate(0deg); }
  15%  { transform: rotate(6deg); }
  35%  { transform: rotate(-3deg); }
  55%  { transform: rotate(5deg); }
  75%  { transform: rotate(-2deg); }
  90%  { transform: rotate(2deg); }
  100% { transform: rotate(0deg); }
}

/* ── 左葉額外輕顫（比整體晚一點，更自然） ── */
.leaf-left {
  animation: leaf-flutter 2.4s ease-in-out 0.85s infinite;
}
@keyframes leaf-flutter {
  0%, 100% { transform: rotate(0deg); }
  30%       { transform: rotate(-5deg); }
  60%       { transform: rotate(4deg); }
}

/* ── 右葉額外輕顫（再錯開一點） ── */
.leaf-right {
  animation: leaf-flutter-r 2.4s ease-in-out 1s infinite;
}
@keyframes leaf-flutter-r {
  0%, 100% { transform: rotate(0deg); }
  25%       { transform: rotate(6deg); }
  55%       { transform: rotate(-3deg); }
}
</style>
