<template>
  <article class="crypto-card" :aria-label="`${coin.name} (${coin.symbol.toUpperCase()})`">
    <div class="card-media">
      <img
        v-if="!imageError"
        :src="coin.image"
        :alt="`${coin.name} logo`"
        class="coin-image"
        width="48"
        height="48"
        decoding="async"
        :loading="priority ? 'eager' : 'lazy'"
        :fetchpriority="priority ? 'high' : 'auto'"
        @error="handleImageError"
      />
      <div v-else class="coin-placeholder" :aria-hidden="true">
        {{ coin.symbol.toUpperCase().slice(0, 2) }}
      </div>
    </div>

    <div class="card-content">
      <header class="card-header">
        <h3 class="coin-name">{{ coin.name }}</h3>
        <span class="coin-symbol">{{ coin.symbol.toUpperCase() }}</span>
      </header>

      <div class="coin-price">
        <span class="price-value">{{ formattedPrice }}</span>
        <span
          v-if="coin.price_change_percentage_24h !== null"
          class="price-change"
          :class="coin.price_change_percentage_24h >= 0 ? 'positive' : 'negative'"
        >
          {{ coin.price_change_percentage_24h >= 0 ? '↑' : '↓' }}
          {{ Math.abs(coin.price_change_percentage_24h).toFixed(2) }}%
        </span>
        <span v-else class="price-change neutral">—</span>
      </div>

      <p class="market-cap">
        Капитализация: {{ formatMarketCap(coin.market_cap) }}
      </p>

      <footer class="card-footer">
        <a
          :href="`https://www.coingecko.com/ru/монеты/${coin.id}`"
          target="_blank"
          rel="noopener noreferrer"
          class="details-link"
        >
          Подробнее ↗
        </a>
      </footer>
    </div>
  </article>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  coin: {
    type: Object,
    required: true,
    validator: (c) => c.id && c.name && c.symbol && c.current_price !== undefined,
  },
  priority: {
    type: Boolean,
    default: false,
  },
})

const imageError = ref(false)

const priceFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const formattedPrice = computed(() => priceFormatter.format(props.coin.current_price))

const handleImageError = () => {
  imageError.value = true
}

const formatMarketCap = (value) => {
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)} трлн $`
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)} млрд $`
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)} млн $`
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'USD' }).format(value)
}
</script>

<style scoped>
.crypto-card {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  min-height: 96px;
  background: var(--ds-bg-surface, #fff);
  border: 1px solid var(--ds-border, #e2e8f0);
  border-radius: var(--ds-radius-lg, 0.75rem);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.crypto-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--ds-shadow-lg, 0 10px 24px rgba(0,0,0,0.12));
}
.card-media {
  flex: 0 0 64px;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.coin-image {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: contain;
}
.coin-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--ds-primary, #3b82f6);
  color: #fff;
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 0.875rem;
}
.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.card-header {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}
.coin-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--ds-text-primary, #0f172a);
  margin: 0;
}
.coin-symbol {
  font-size: 0.875rem;
  color: var(--ds-text-muted, #64748b);
  text-transform: uppercase;
}
.coin-price {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.price-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--ds-text-primary);
}
.price-change {
  font-size: 0.875rem;
  font-weight: 500;
}
.price-change.positive { color: var(--ds-success, #22c55e); }
.price-change.negative { color: var(--ds-error, #ef4444); }
.price-change.neutral { color: var(--ds-text-muted); }
.market-cap {
  font-size: 0.875rem;
  color: var(--ds-text-muted);
  margin: 0;
}
.card-footer {
  margin-top: auto;
}
.details-link {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--ds-primary);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.875rem;
  padding: 0.25rem 0;
}
.details-link:hover {
  text-decoration: underline;
}
.details-link:focus-visible {
  outline: 2px solid var(--ds-focus, #3b82f6);
  outline-offset: 2px;
  border-radius: 4px;
}

@media (max-width: 480px) {
  .crypto-card {
    flex-direction: column;
    text-align: center;
  }
  .card-header, .coin-price {
    justify-content: center;
  }
}
</style>
