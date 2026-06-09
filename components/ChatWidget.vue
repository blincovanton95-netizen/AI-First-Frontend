<template>
  <div class="chat-widget">
    <button
      type="button"
      class="chat-toggle"
      :aria-label="isOpen ? 'Закрыть чат' : 'Открыть чат'"
      :aria-expanded="isOpen"
      @click="isOpen = !isOpen"
    >
      <span v-if="isOpen" aria-hidden="true">✕</span>
      <span v-else aria-hidden="true">💬</span>
    </button>

    <section
      v-show="isOpen"
      class="chat-panel"
      role="dialog"
      aria-label="Чат с ассистентом"
      aria-modal="false"
    >
      <header class="chat-header">
        <h2 class="chat-title">Помощник</h2>
        <span v-if="isLoading" class="chat-status" aria-live="polite">Печатает…</span>
      </header>

      <div
        ref="messagesEl"
        class="chat-messages"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        <p v-if="!messages.length" class="chat-empty">
          Задайте вопрос о криптовалютах
        </p>
        <article
          v-for="(msg, index) in messages"
          :key="index"
          class="chat-bubble"
          :class="`chat-bubble--${msg.role}`"
        >
          <span class="chat-bubble__role">{{ msg.role === 'user' ? 'Вы' : 'Бот' }}</span>
          <p class="chat-bubble__text">{{ msg.content }}<span v-if="isLoading && index === messages.length - 1 && msg.role === 'assistant'" class="cursor">▋</span></p>
        </article>
      </div>

      <form class="chat-form" @submit.prevent="sendMessage">
        <input
          v-model="inputText"
          type="text"
          class="chat-input"
          placeholder="Введите сообщение…"
          :disabled="isLoading"
          aria-label="Текст сообщения"
          autocomplete="off"
        />
        <button
          type="submit"
          class="chat-send"
          :disabled="isLoading || !inputText.trim()"
          aria-label="Отправить сообщение"
        >
          ↑
        </button>
      </form>
    </section>
  </div>
</template>

<script setup>
import { ref, nextTick, watch } from 'vue'

const CHAT_API_URL = import.meta.env.VITE_CHAT_API_URL || 'http://localhost:3000/api/chat'

const isOpen = ref(false)
const isLoading = ref(false)
const inputText = ref('')
const messages = ref([])
const messagesEl = ref(null)

const scrollToBottom = async () => {
  await nextTick()
  if (messagesEl.value) {
    messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  }
}

watch(messages, scrollToBottom, { deep: true })

const parseSseStream = async (response, onChunk) => {
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  let done = false
  while (!done) {
    const result = await reader.read()
    done = result.done
    const value = result.value
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const payload = line.slice(6).trim()
      if (payload === '[DONE]') return

      const { content, error } = JSON.parse(payload)
      if (error) throw new Error(error)
      if (content) onChunk(content)
    }
  }
}

const sendMessage = async () => {
  const text = inputText.value.trim()
  if (!text || isLoading.value) return

  messages.value.push({ role: 'user', content: text })
  messages.value.push({ role: 'assistant', content: '' })
  inputText.value = ''
  isLoading.value = true

  const history = messages.value.slice(0, -2)

  try {
    const response = await fetch(CHAT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error || `HTTP ${response.status}`)
    }

    const assistantIndex = messages.value.length - 1

    await parseSseStream(response, (chunk) => {
      messages.value[assistantIndex].content += chunk
    })
  } catch (err) {
    const last = messages.value[messages.value.length - 1]
    if (last?.role === 'assistant' && !last.content) {
      last.content = `Ошибка: ${err.message}`
    } else {
      messages.value.push({ role: 'assistant', content: `Ошибка: ${err.message}` })
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.chat-widget {
  position: fixed;
  right: 1.25rem;
  bottom: 1.25rem;
  z-index: 1000;
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
}

.chat-toggle {
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 50%;
  border: none;
  background: var(--ds-primary, #3b82f6);
  color: #fff;
  font-size: 1.25rem;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.45);
  transition: transform 0.2s, box-shadow 0.2s;
}
.chat-toggle:hover {
  transform: scale(1.05);
  box-shadow: 0 10px 28px rgba(59, 130, 246, 0.55);
}
.chat-toggle:focus-visible {
  outline: 2px solid #1d4ed8;
  outline-offset: 3px;
}

.chat-panel {
  position: absolute;
  right: 0;
  bottom: 4rem;
  width: min(360px, calc(100vw - 2rem));
  height: 28rem;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 1rem;
  border: 1px solid var(--ds-border, #e2e8f0);
  box-shadow: 0 16px 48px rgba(15, 23, 42, 0.18);
  overflow: hidden;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem;
  border-bottom: 1px solid var(--ds-border, #e2e8f0);
  background: #f8fafc;
}
.chat-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--ds-text-primary, #0f172a);
}
.chat-status {
  font-size: 0.75rem;
  color: var(--ds-text-muted, #64748b);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.chat-empty {
  margin: auto;
  text-align: center;
  color: var(--ds-text-muted, #64748b);
  font-size: 0.875rem;
}

.chat-bubble {
  max-width: 88%;
  padding: 0.5rem 0.75rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  line-height: 1.45;
}
.chat-bubble--user {
  align-self: flex-end;
  background: var(--ds-primary, #3b82f6);
  color: #fff;
  border-bottom-right-radius: 0.25rem;
}
.chat-bubble--assistant {
  align-self: flex-start;
  background: #f1f5f9;
  color: var(--ds-text-primary, #0f172a);
  border-bottom-left-radius: 0.25rem;
}
.chat-bubble__role {
  display: block;
  font-size: 0.65rem;
  font-weight: 600;
  opacity: 0.75;
  margin-bottom: 0.15rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.chat-bubble__text {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}
.cursor {
  animation: blink 1s step-end infinite;
}
@keyframes blink {
  50% { opacity: 0; }
}

.chat-form {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem;
  border-top: 1px solid var(--ds-border, #e2e8f0);
  background: #fff;
}
.chat-input {
  flex: 1;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--ds-border, #cbd5e1);
  border-radius: 0.5rem;
  font-size: 0.875rem;
}
.chat-input:focus {
  outline: none;
  border-color: var(--ds-primary, #3b82f6);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}
.chat-send {
  width: 2.5rem;
  height: 2.5rem;
  border: none;
  border-radius: 0.5rem;
  background: var(--ds-primary, #3b82f6);
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
}
.chat-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .chat-panel {
    width: calc(100vw - 2rem);
    height: 70vh;
  }
}
</style>
