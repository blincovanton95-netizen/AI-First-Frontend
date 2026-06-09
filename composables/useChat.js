import { ref, computed } from 'vue';

const API_URL = import.meta.env.DEV 
  ? 'http://localhost:3000/api/chat' 
  : '/api/chat';

export function useChat() {
  const messages = ref([]);
  const isStreaming = ref(false);
  const error = ref(null);
  const conversationId = ref(Date.now()); // ID текущей сессии

  // 🔹 История для отправки на бэкенд (без текущего незавершённого сообщения)
  const historyForApi = computed(() => {
    return messages.value
      .filter(m => m.role === 'user' || (m.role === 'assistant' && !m.isStreaming))
      .map(m => ({ role: m.role, content: m.content }))
      .slice(-20); // Лимит 20 сообщений
  });

  async function send(text) {
    if (!text.trim() || isStreaming.value) return;

    // Добавляем сообщение пользователя
    messages.value.push({ 
      role: 'user', 
      content: text.trim(),
      timestamp: Date.now()
    });
    
    // Пустое сообщение ассистента (будем заполнять потоком)
    const assistantMessage = { 
      role: 'assistant', 
      content: '', 
      isStreaming: true,
      timestamp: Date.now()
    };
    messages.value.push(assistantMessage);
    
    isStreaming.value = true;
    error.value = null;

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          history: historyForApi.value.slice(0, -1) // Без текущего assistant-сообщения
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Оставляем неполную строку в буфере

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            assistantMessage.isStreaming = false;
            break;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              throw new Error(parsed.message || 'Ошибка сервера');
            }
            const content = parsed.choices?.[0]?.delta?.content || '';
            assistantMessage.content += content;
          } catch (e) {
            console.warn('Parse SSE chunk error:', e);
          }
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      error.value = err.message;
      assistantMessage.content = `❌ Ошибка: ${err.message}\n\nПопробуйте ещё раз или начните новый диалог.`;
      assistantMessage.isStreaming = false;
    } finally {
      isStreaming.value = false;
    }
  }

  // 🆕 Очистка истории — "Новый диалог"
  function clearHistory() {
    messages.value = [];
    error.value = null;
    conversationId.value = Date.now(); // Новый ID сессии
    console.log('🧹 Chat history cleared');
  }

  // 🆕 Удаление последнего сообщения (retry)
  function retryLastMessage() {
    if (messages.value.length < 2) return;
    const lastUserMsg = [...messages.value].reverse().find(m => m.role === 'user');
    if (!lastUserMsg) return;
    
    // Удаляем последнее сообщение пользователя и ответ ассистента
    messages.value = messages.value.slice(0, -2);
    send(lastUserMsg.content);
  }

  return { 
    messages, 
    isStreaming, 
    error, 
    conversationId,
    send, 
    clearHistory,
    retryLastMessage
  };
}