<template>
  <main class="app-container">
    <header class="app-header">
      <h1>🪙 CryptoTracker</h1>
      <p v-if="lastUpdated" class="last-updated">
        <span v-if="isStale" class="stale-badge">кэш</span>
        Обновлено: {{ formatTime(lastUpdated) }}
        <span v-if="isRefreshing" class="refreshing" aria-live="polite">↻</span>
      </p>
    </header>

    <div v-if="coins.length" class="search-bar">
      <input
        v-model="searchQuery"
        type="search"
        placeholder="Поиск по названию или символу..."
        class="search-input"
        aria-label="Поиск криптовалют"
      />
    </div>

    <Loader v-if="isLoading && !coins.length" size="lg" label="Загружаем данные..." />

    <ErrorAlert
      v-else-if="error && !coins.length"
      :message="error"
      :on-retry="refresh"
    />

    <div v-else-if="filteredCoins.length" class="coins-grid">
      <CryptoCard
        v-for="(coin, index) in filteredCoins"
        :key="coin.id"
        :coin="coin"
        :priority="index < 3"
      />
    </div>

    <div v-else-if="coins.length && searchQuery" class="empty-state">
      <p>Ничего не найдено по запросу "{{ searchQuery }}"</p>
      <button class="reset-btn" @click="searchQuery = ''">🔄 Сбросить поиск</button>
    </div>

    <div v-else class="empty-state">
      <p>Нет данных для отображения</p>
    </div>

    <p v-if="error && coins.length" class="stale-error" role="status">
      Не удалось обновить данные: {{ error }}
      <button type="button" class="retry-inline" @click="refresh">Повторить</button>
    </p>
  </main>
</template>

<script setup>
import { defineAsyncComponent } from 'vue'
import { useCryptoData } from '@/composables/useCryptoData'
import Loader from '@/components/Loader.vue'
import ErrorAlert from '@/components/ErrorAlert.vue'

const CryptoCard = defineAsyncComponent(() => import('@/components/CryptoCard.vue'))

const {
  coins,
  filteredCoins,
  isLoading,
  isRefreshing,
  isStale,
  error,
  lastUpdated,
  searchQuery,
  refresh,
} = useCryptoData({
  initialParams: { perPage: 10 },
  autoFetch: true,
})

const formatTime = (date) => {
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).format(date)
}
</script>

<style scoped>
.app-container { max-width: 1200px; margin: 0 auto; padding: 2rem 1rem; min-height: 100vh; }
.app-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--ds-border, #e2e8f0); }
.app-header h1 { font-size: 1.75rem; color: var(--ds-text-primary, #0f172a); }
.last-updated { font-size: 0.875rem; color: var(--ds-text-muted, #64748b); display: flex; align-items: center; gap: 0.35rem; }
.stale-badge { font-size: 0.7rem; padding: 0.1rem 0.35rem; border-radius: 4px; background: #fef3c7; color: #92400e; }
.refreshing { display: inline-block; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.search-bar { margin-bottom: 1.5rem; }
.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--ds-border, #cbd5e1);
  border-radius: var(--ds-radius-md, 0.5rem);
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.search-input:focus {
  outline: none;
  border-color: var(--ds-focus, #3b82f6);
  box-shadow: 0 0 0 3px var(--ds-focus-ring, rgba(59,130,246,0.25));
}

.coins-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  min-height: 880px;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--ds-text-muted);
  background: #f8fafc;
  border-radius: 12px;
}
.reset-btn {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: var(--ds-primary, #3b82f6);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
.reset-btn:hover { background: var(--ds-primary-hover, #2563eb); }

.stale-error {
  margin-top: 1rem;
  font-size: 0.875rem;
  color: #b45309;
}
.retry-inline {
  margin-left: 0.5rem;
  background: none;
  border: none;
  color: var(--ds-primary, #3b82f6);
  cursor: pointer;
  text-decoration: underline;
}
</style>
