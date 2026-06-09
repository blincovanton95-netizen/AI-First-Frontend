import { ref } from 'vue';
import { sendMessage } from '@/services/chatService';

export function useChat() {
  const messages = ref([]);
  const isStreaming = ref(false);
  const error = ref(null);

  async function send(text) {
    // Добавляем сообщение пользователя
    messages.value.push({ role: 'user', content: text });
    
    // Добавляем пустое сообщение ассистента (будем заполнять потоком)
    const assistantMessage = { role: 'assistant', content: '', isStreaming: true };
    messages.value.push(assistantMessage);
    
    isStreaming.value = true;
    error.value = null;

    try {
      const response = await sendMessage(text, messages.value.slice(0, -2));
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

        for (const line of lines) {
          const data = line.replace('data: ', '');
          if (data === '[DONE]') {
            assistantMessage.isStreaming = false;
            break;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            assistantMessage.content += content;
          } catch (e) {
            console.error('Parse error:', e);
          }
        }
      }
    } catch (err) {
      error.value = err.message;
      assistantMessage.content = '❌ Ошибка: ' + err.message;
      assistantMessage.isStreaming = false;
    } finally {
      isStreaming.value = false;
    }
  }

  return { messages, isStreaming, error, send };
}