import { getMockResponse } from '../mock/responses.js';

// ⚙️ Конфигурация
const MOCK_DELAY_MS = parseInt(process.env.MOCK_DELAY_MS || '30');

// 🧹 Sanitization: защита от prompt injection
const sanitizeMessage = (text) => {
  const dangerousPatterns = [
    /ignore previous instructions/gi,
    /disregard all prior/gi,
    /forget everything above/gi,
    /you are now/gi,
    /system prompt/gi
  ];
  let sanitized = text;
  dangerousPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[FILTERED]');
  });
  return sanitized.substring(0, 2000);
};

// ✅ Валидация
const validateChatRequest = (body) => {
  const errors = [];
  if (!body.message || typeof body.message !== 'string') {
    errors.push('Поле "message" обязательно и должно быть строкой');
  } else if (body.message.length > 2000) {
    errors.push('Сообщение не должно превышать 2000 символов');
  }
  if (body.history && !Array.isArray(body.history)) {
    errors.push('Поле "history" должно быть массивом');
  } else if (Array.isArray(body.history) && body.history.length > 20) {
    errors.push('История не должна содержать более 20 сообщений');
  }
  return errors;
};

// 🎭 MOCK: Генерация "токенов" из ответа с задержкой
async function* generateMockStream(message, history) {
  const response = getMockResponse(message, history);
  
  // Разбиваем ответ на "токены" (слова + знаки препинания)
  const tokens = response.match(/\S+\s*|[.,!?;:]+\s*/g) || [response];
  
  for (const token of tokens) {
    const delay = MOCK_DELAY_MS + Math.random() * 50;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    yield {
      id: `chatcmpl-mock-${Date.now()}`,
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model: 'mock-gpt-4o-mini',
      choices: [{
        index: 0,
        delta: { content: token },
        finish_reason: null
      }]
    };
  }
  
  yield {
    id: `chatcmpl-mock-${Date.now()}`,
    object: 'chat.completion.chunk',
    created: Math.floor(Date.now() / 1000),
    model: 'mock-gpt-4o-mini',
    choices: [{
      index: 0,
      delta: {},
      finish_reason: 'stop'
    }]
  };
}

// 🎯 Vercel Serverless Function handler
export default async function handler(req, res) {
  // Разрешаем только POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Валидация
  const validationErrors = validateChatRequest(req.body);
  if (validationErrors.length > 0) {
    return res.status(400).json({ error: 'Невалидный запрос', details: validationErrors });
  }

  const { message, history = [] } = req.body;
  const sanitizedMessage = sanitizeMessage(message);

  console.log(`💬 User: ${sanitizedMessage.substring(0, 100)}`);

  try {
    // 🔧 Установка SSE-заголовков
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    // 📤 Потоковая передача мок-чанков
    const stream = generateMockStream(sanitizedMessage, history);
    
    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }

    // ✅ Завершение потока
    res.write('data: [DONE]\n\n');
    res.end();
    
    console.log('✅ Response streamed successfully');

  } catch (error) {
    console.error('❌ Mock stream error:', error.message);
    
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
    
    res.write(`data: ${JSON.stringify({ error: true, message: 'Ошибка генерации' })}\n\n`);
    res.end();
  }
}

// ⚙️ Конфигурация Vercel Serverless Function
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50kb',
    },
    responseLimit: false,
  },
  // Максимальное время выполнения: 10 секунд (Hobby plan)
  maxDuration: 10,
};