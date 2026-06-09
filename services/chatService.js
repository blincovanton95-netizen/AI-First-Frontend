const API_URL = import.meta.env.DEV 
  ? 'http://localhost:3000/api/chat' 
  : '/api/chat'; // На продакшене — относительный путь

export async function sendMessage(message, history = []) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history })
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response; // Вернёт ReadableStream для SSE
}