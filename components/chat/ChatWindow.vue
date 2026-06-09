<template>
  <div class="chat-window" role="dialog" aria-label="Чат с AI-ассистентом">
    <!-- Заголовок -->
    <header class="chat-header">
      <div class="header-left">
        <div class="avatar">🤖</div>
        <div class="header-info">
          <h3 class="title">CryptoTracker Assistant</h3>
          <p class="status" :class="{ streaming: isStreaming }">
            {{ isStreaming ? 'Печатает...' : 'Онлайн' }}
          </p>
        </div>
      </div>
      <div class="header-actions">
        <!-- 🆕 Кнопка "Новый диалог" -->
        <button 
          v-if="messages.length > 0"
          class="icon-btn" 
          @click="handleNewChat"
          aria-label="Начать новый диалог"
          title="Новый диалог"
        >
          🔄
        </button>
        <button 
          class="icon-btn close-btn" 
          @click="$emit('close')"
          aria-label="Закрыть чат"
        >
          ✕
        </button>
      </div>
    </header>

    <!-- Сообщения -->
    <div class="messages-container" ref="messagesContainer">
      <div v-if="messages.length === 0" class="welcome-message">
        <h4>👋 Привет! Я помогу разобраться с криптовалютами</h4>
        <p>Спросите меня о Bitcoin, Ethereum, блокчейне или безопасности крипто-активов.</p>
        <div class="quick-questions">
          <button 
            v-for="q in quickQuestions" 
            :key="q"
            class="quick-btn"
            @click="send(q)"
          >
            {{ q }}
          </button>
        </div>
      </div>

      <MessageBubble 
        v-for="(msg, idx) in messages" 
        :key="idx"
        :message="msg"
        @retry="retryLastMessage"
      />
    </div>

    <!-- Ошибка -->
    <div v-if="error" class="error-banner" role="alert">
      ⚠️ {{ error }}
      <button @click="error = null" class="error-close">✕</button>
    </div>

    <!-- Ввод -->
    <MessageInput 
      @send="send" 
      :disabled="isStreaming"
      :placeholder="isStreaming ? 'Ожидайте ответа...' : 'Задайте вопрос о криптовалютах...'"
    />
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import MessageBubble from './MessageBubble.vue';
import MessageInput from './MessageInput.vue';

const props = defineProps({
  messages: { type: Array, required: true },
  isStreaming: { type: Boolean, default: false },
  error: { type: String, default: null },
  send: { type: Function, required: true },
  clearHistory: { type: Function, required: true },
  retryLastMessage: { type: Function, required: true }
});

const emit = defineEmits(['close']);
const messagesContainer = ref(null);

const quickQuestions = [
  'Что такое Bitcoin?',
  'Как работает блокчейн?',
  'Что такое NFT?',
  'Как безопасно хранить крипту?'
];

// Автопрокрутка вниз при новых сообщениях
watch(() => props.messages.length, async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
});

// Автопрокрутка во время streaming
watch(() => props.messages[props.messages.length - 1]?.content, async () => {
  await nextTick();
  if (messagesContainer.value && props.isStreaming) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
});

const handleNewChat = () => {
  if (confirm('Начать новый диалог? Текущая история будет удалена.')) {
    props.clearHistory();
  }
};
</script>

<style scoped>
.chat-window {
  display: flex;
  flex-direction: column;
  height: 600px;
  max-height: 80vh;
  background: var(--ds-bg-surface, #fff);
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.15);
  overflow: hidden;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
}
.header-left { display: flex; align-items: center; gap: 0.75rem; }
.avatar { font-size: 1.5rem; }
.title { margin: 0; font-size: 1rem; font-weight: 600; }
.status { margin: 0; font-size: 0.75rem; opacity: 0.9; }
.status.streaming { animation: pulse 1.5s ease-in-out infinite; }
@keyframes pulse { 0%, 100% { opacity: 0.9; } 50% { opacity: 0.5; } }

.header-actions { display: flex; gap: 0.5rem; }
.icon-btn {
  background: rgba(255,255,255,0.2);
  border: none;
  color: #fff;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: background 0.2s;
}
.icon-btn:hover { background: rgba(255,255,255,0.3); }
.icon-btn:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.welcome-message {
  text-align: center;
  padding: 2rem 1rem;
  color: var(--ds-text-muted, #64748b);
}
.welcome-message h4 { margin: 0 0 0.5rem; color: var(--ds-text-primary, #0f172a); }
.quick-questions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 1rem;
}
.quick-btn {
  padding: 0.5rem 0.75rem;
  background: var(--ds-bg-page, #f8fafc);
  border: 1px solid var(--ds-border, #e2e8f0);
  border-radius: 20px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}
.quick-btn:hover {
  background: var(--ds-primary, #3b82f6);
  color: #fff;
  border-color: var(--ds-primary);
}

.error-banner {
  padding: 0.75rem 1rem;
  background: #fef2f2;
  color: #991b1b;
  font-size: 0.875rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.error-close {
  background: none;
  border: none;
  color: #991b1b;
  cursor: pointer;
  font-size: 1rem;
}
</style>