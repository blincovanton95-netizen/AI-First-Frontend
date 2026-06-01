Роль: Ты — Senior Frontend Developer, эксперт по работе с REST API и нативным fetch.
Цель: Создать модуль `cryptoService.js` для взаимодействия с CoinGecko Public API.

Технические требования:
1. Базовый URL: `https://api.coingecko.com/api/v3`
2. Реализовать функцию `fetchTopCryptos({ vsCurrency = 'usd', order = 'market_cap_desc', perPage = 10, page = 1 })`.
3. Использовать нативный `fetch` с `async/await`. Не использовать внешние библиотеки (axios и т.д.).
4. Формировать query-параметры через `URLSearchParams` или шаблонные строки.
5. Проверять `response.ok`. Если `false` → выбрасывать `new Error(`HTTP ${response.status}: ${response.statusText}`)`.
6. Обрабатывать сетевые ошибки через `try/catch` и пробрасывать их выше.
7. Возвращать распарсенный JSON: `return response.json()`.
8. Добавить JSDoc-комментарии для типизации и автодополнения в IDE.
9. Не хардкодить чувствительные данные (ключи, токены) — использовать `import.meta.env` для переменных окружения (если потребуются в будущем).