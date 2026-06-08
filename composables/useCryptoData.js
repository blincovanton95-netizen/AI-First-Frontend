import { ref, computed, onMounted, watch } from 'vue'
import { fetchTopCryptos, readCachedTopCryptos } from '@/services/cryptoService'

const SEARCH_DEBOUNCE_MS = 300

/**
 * Композабл для управления данными криптовалют
 */
export const useCryptoData = ({ initialParams = {}, autoFetch = true } = {}) => {
  const params = ref({ ...initialParams })
  const initialCache = readCachedTopCryptos(params.value)

  const coins = ref(initialCache.data ?? [])
  const isLoading = ref(!initialCache.data)
  const isRefreshing = ref(false)
  const isStale = ref(initialCache.isStale)
  const error = ref(null)
  const lastUpdated = ref(initialCache.data ? new Date() : null)
  const searchQuery = ref('')
  const debouncedSearchQuery = ref('')

  let searchDebounceTimer

  watch(searchQuery, (value) => {
    clearTimeout(searchDebounceTimer)
    searchDebounceTimer = setTimeout(() => {
      debouncedSearchQuery.value = value
    }, SEARCH_DEBOUNCE_MS)
  })

  const fetch = async (overrideParams = {}) => {
    const hadCoins = coins.value.length > 0
    if (!hadCoins) {
      isLoading.value = true
    } else {
      isRefreshing.value = true
    }
    error.value = null

    try {
      const mergedParams = { ...params.value, ...overrideParams }
      const data = await fetchTopCryptos(mergedParams)
      coins.value = data
      lastUpdated.value = new Date()
      isStale.value = false
      return data
    } catch (err) {
      error.value = err.message || 'Неизвестная ошибка'
      if (!coins.value.length) {
        console.error('[useCryptoData] Ошибка:', err)
      }
      throw err
    } finally {
      isLoading.value = false
      isRefreshing.value = false
    }
  }

  const refresh = () => fetch(params.value)

  const filteredCoins = computed(() => {
    if (!debouncedSearchQuery.value.trim()) return coins.value
    const query = debouncedSearchQuery.value.toLowerCase()
    return coins.value.filter(coin =>
      coin.name.toLowerCase().includes(query) ||
      coin.symbol.toLowerCase().includes(query)
    )
  })

  const updateParams = (newParams) => {
    params.value = { ...params.value, ...newParams }
    return fetch(params.value)
  }

  if (autoFetch) {
    onMounted(() => { fetch(params.value) })
  }

  return {
    coins,
    filteredCoins,
    isLoading,
    isRefreshing,
    isStale,
    error,
    lastUpdated,
    searchQuery,
    refresh,
    updateParams,
    fetch,
  }
}
