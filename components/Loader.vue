<template>
  <div class="loader-wrapper" role="status" :aria-label="label || 'Загрузка...'">
    <div class="spinner" :style="{ width: sizePx, height: sizePx, borderColor: colorVar }"></div>
    <span v-if="label" class="sr-only">{{ label }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  size: { type: String, default: 'md', validator: v => ['sm', 'md', 'lg'].includes(v) },
  color: { type: String, default: '--ds-primary' },
  label: { type: String, default: '' }
})

const sizeMap = { sm: '24px', md: '40px', lg: '64px' }
const sizePx = computed(() => sizeMap[props.size])
const colorVar = computed(() => `var(${props.color}, #3b82f6)`)
</script>

<style scoped>
.loader-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}
.spinner {
  border: 3px solid rgba(0,0,0,0.1);
  border-left-color: v-bind(colorVar);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
  white-space: nowrap;
  border: 0;
}
</style>