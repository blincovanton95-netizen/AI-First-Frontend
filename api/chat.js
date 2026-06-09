import { getMockResponse } from '../mock/responses.js';

const MOCK_DELAY_MS = parseInt(process.env.MOCK_DELAY_MS || '30');

// 🧠 SYSTEM PROMPT — невидимое сообщение, задающее роль ассистента
const SYSTEM_PROMPT = `Ты — AI-ассистент образовательной платформы "CodeHub" (CryptoTracker).
Твоя специализация: криптовалюты, блокчейн, Web3, DeFi, NFT, безопасность крипто-активов.

Правила поведения:
- Отвечай кратко, по делу, на русском языке
- Используй Markdown для форматирования (**жирный**, списки, заголовки)
- Если вопрос не по теме — вежливо верни пользователя к крипто-тематике
- Не давай финансовых советов, только образовательную информацию
- Будь дружелюбным, но профессиональным`;

// 🧹 Sanitization
const sanitizeMessage = (text) => {
  const dangerousPatterns = [
    /ignore previous instructions/gi,
    /disregard all prior/gi,
    /forget everything above/gi,
    /you are now/gi,
    /system prompt/gi,
    /act as/gi,
    /pretend you are/gi
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
    errors.push('Поле "message" обязательно');
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

// 🎭 MOCK: Генерация потока с учётом истории и system prompt
async function* generateMockStream(message, history) {
  // 🔹 В реальной OpenAI-версии здесь бы формировался массив messages:
  // [
  //   { role: 'system', content: SYSTEM_PROMPT },
  //   ...history,
  //   { role: 'user', content: message }
  // ]
  // Для мока передаём system prompt как контекст в getMockResponse
  
  const response = getMockResponse(message, history, SYSTEM_PROMPT);
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const validationErrors = validateChatRequest(req.body);
  if (validationErrors.length > 0) {
    return res.status(400).json({ error: 'Невалидный запрос', details: validationErrors });
  }

  const { message, history = [] } = req.body;
  const sanitizedMessage = sanitizeMessage(message);

  // 🔒 Санитизация истории (защита от инъекций через старые сообщения)
  const sanitizedHistory = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: sanitizeMessage(String(msg.content || '').substring(0, 1000))
  }));

  console.log(`💬 User: ${sanitizedMessage.substring(0, 80)}... | History: ${sanitizedHistory.length} msgs`);

  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const stream = generateMockStream(sanitizedMessage, sanitizedHistory);
    
    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error('❌ Stream error:', error.message);
    
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
    
    res.write(`data: ${JSON.stringify({ error: true, message: 'Ошибка генерации' })}\n\n`);
    res.end();
  }
}

export const config = {
  api: {
    bodyParser: { sizeLimit: '50kb' },
    responseLimit: false,
  },
  maxDuration: 10,
};