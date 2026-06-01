# Спецификация API и архитектура приложения: CryptoTracker

## Выбор API
**Название:** CoinGecko Public API  
**Версия:** v3  
**Документация:** [https://docs.coingecko.com/reference/coins-market](https://docs.coingecko.com/reference/coins-market)  
**Причина выбора:** Не требует регистрации и API-ключа для базовых эндпоинтов, возвращает структурированный JSON, поддерживает CORS, идеален для демонстрации работы с состоянием, загрузкой и ошибкой.

---

## Ответы на вопросы по API

| Вопрос | Ответ |
|--------|-------|
| **Базовый URL** | `https://api.coingecko.com/api/v3` |
| **Аутентификация / Ключ** | Не требуется для публичных эндпоинтов. Запросы отправляются напрямую. |
| **Целевой эндпоинт** | `GET /coins/markets` |
| **Параметры запроса** | `vs_currency=usd` (обязательный)<br>`order=market_cap_desc` (опциональный, по умолчанию)<br>`per_page=10` (опциональный)<br>`page=1` (опциональный)<br>`sparkline=false` (опциональный, отключаем для скорости) |
| **Структура успешного ответа (JSON)** | Массив объектов. Ключевые поля:<br>`id` (string), `symbol` (string), `name` (string), `image` (url small), `current_price` (number), `market_cap` (number), `price_change_percentage_24h` (number \| null), `last_updated` (ISO string) |
| **Ограничения (Rate Limits)** | ~10–30 запросов/минуту на один IP. При превышении возвращается `429 Too Many Requests`. Рекомендуется кэшировать ответы или добавлять debounce/повторную попытку. |

**Пример запроса:**  
`GET https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false`

---

## Архитектура приложения

### Цель приложения
Отображать топ-10 криптовалют по рыночной капитализации. Показывать иконку, название, текущую цену, изменение за 24ч (зелёный/красный индикатор) и время последнего обновления. Пользователь может вручную обновить данные. Приложение должно корректно обрабатывать состояния загрузки и сетевых ошибок.

### Структура компонентов (Vue 3)
| Компонент | Назначение | Пропсы / События |
|-----------|-----------|------------------|
| `App.vue` | Корневой контейнер, шапка, глобальные стили | – |
| `CryptoDashboard.vue` | Оркестратор: управляет состоянием загрузки, ошибками и данными | `isLoading`, `error`, `coins`, `@refresh` |
| `CryptoList.vue` | Рендерит сетку карточек через `v-for` | `coins: Array` |
| `CryptoCard.vue` | Отображает данные одной монеты | `coin: Object`, `lastUpdated: Date` |
| `Loader.vue` | Анимированный спиннер | `size: sm \| md` |
| `ErrorAlert.vue` | Сообщение об ошибке + кнопка повтора | `message: string`, `onRetry: Function` |

### Состояние (State)
Хранится в композабле `useCryptoData.js` (Composition API, без Pinia для простоты):
```js
state: {
  coins: [],           // Array<CryptoCoin>
  isLoading: false,    // boolean
  error: null,         // string | null
  lastFetched: null,   // Date | null
  retryCount: 0        // number (для обработки 429)
}

### Логика работы
**Монтирование:** App → вызывает useCryptoData().fetchData()
isLoading = true, error = null
**Запрос:** fetch(BASE_URL + params)
Если response.ok → coins = await response.json(), lastFetched = new Date(), isLoading = false
**Обработка ошибок:**
429 → подождать 2с, повторить (макс. 2 раза), иначе error = "Слишком много запросов. Попробуйте позже."
!response.ok или TypeError (сеть) → error = "Не удалось загрузить данные", isLoading = false
**Рендер UI:**
isLoading === true → показать <Loader />
error !== null → показать <ErrorAlert message />
coins.length > 0 → показать <CryptoList :coins /> + таймер последнего обновления
**Пользовательское действие:** Клик по кнопке "Обновить" → сбросить retryCount, вызвать fetchData() заново.