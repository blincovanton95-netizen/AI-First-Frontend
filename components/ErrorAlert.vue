<template>
  <div class="error-alert" role="alert" aria-live="assertive">
    <div class="error-icon" aria-hidden="true">⚠️</div>
    <div class="error-content">
      <p class="error-message">{{ message }}</p>
      <p v-if="code" class="error-code">Код: {{ code }}</p>
      <button 
        v-if="onRetry" 
        class="retry-btn" 
        @click="handleRetry"
        :disabled="isRetrying"
      >
        {{ isRetrying ? 'Повтор...' : '🔄 Повторить' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  message: { type: String, required: true },
  code: { type: [String, Number], default: null },
  onRetry: { type: Function, default: null }
})

const isRetrying = ref(false)

const handleRetry = async () => {
  if (!props.onRetry || isRetrying.value) return
  isRetrying.value = true
  try {
    await props.onRetry()
  } finally {
    isRetrying.value = false
  }
}
</script>

<style scoped>
.error-alert {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: var(--ds-error-bg, #fef2f2);
  border: 1px solid var(--ds-error-border, #fecaca);
  border-radius: var(--ds-radius-md, 0.5rem);
  color: var(--ds-error-text, #991b1b);
}
.error-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}
.error-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.error-message {
  margin: 0;
  font-weight: 500;
}
.error-code {
  margin: 0;
  font-size: 0.75rem;
  opacity: 0.8;
  font-family: monospace;
}
.retry-btn {
  align-self: flex-start;
  padding: 0.5rem 1rem;
  background: var(--ds-error, #ef4444);
  color: #fff;
  border: none;
  border-radius: var(--ds-radius-sm, 0.375rem);
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}
.retry-btn:hover:not(:disabled) {
  background: #dc2626;
}
.retry-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.retry-btn:focus-visible {
  outline: 2px solid var(--ds-focus, #3b82f6);
  outline-offset: 2px;
}

/* Mobile: полный ширина кнопки */
@media (max-width: 480px) {
  .retry-btn {
    width: 100%;
  }
}
</style>