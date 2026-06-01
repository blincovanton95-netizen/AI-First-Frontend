Роль: Ты — Senior Vue 3 Architect, эксперт по композиции и переиспользуемой логике.
Задача: Проанализировать App.vue и выделить всю логику работы с данными (загрузка, состояние, ошибки, кэш) в отдельный композабл useCryptoData.js.

Требования к композаблу:
1. Экспортировать функцию useCryptoData(initialParams), которая возвращает реактивные значения:
   - coins: ref([])
   - isLoading: ref(false)
   - error: ref(null)
   - lastUpdated: ref(null)
   - refresh(): Promise<void> — принудительное обновление
2. Внутри использовать fetchTopCryptos из cryptoService.js.
3. Обрабатывать ошибки через try/catch, устанавливать error.value.
4. Автоматически загружать данные при монтировании (опциональный флаг autoFetch: true).
5. Добавить debounced-поиск (опционально): searchQuery ref + computed filteredCoins.
6. Типизировать через JSDoc для автодополнения.

Формат: 1) Краткий анализ текущего кода, 2) Полный код useCryptoData.js, 3) Обновлённый App.vue с использованием композабла.