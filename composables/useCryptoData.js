import { ref, computed, onMounted } from 'vue'
import { fetchTopCryptos } from '@/services/cryptoService'

/**
 * Композабл для управления данными криптовалют
 * @param {Object} options - Конфигурация
 * @param {Object} [options.initialParams] - Параметры запроса по умолчанию
 * @param {boolean} [options.autoFetch=true] - Загружать ли данные при монтировании
 * @returns {Object} Реактивное состояние и методы
 */
export const useCryptoData = ({ initialParams = {}, autoFetch = true } = {}) => {
  const coins = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  const lastUpdated = ref(null)
  const searchQuery = ref('')
  const params = ref({ ...initialParams })

  const fetch = async (overrideParams = {}) => {
    isLoading.value = true
    error.value = null

    try {
      const mergedParams = { ...params.value, ...overrideParams }
      const data = await fetchTopCryptos(mergedParams)
      coins.value = data
      lastUpdated.value = new Date()
      return data
    } catch (err) {
      error.value = err.message || 'Неизвестная ошибка'
      console.error('[useCryptoData] Ошибка:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const refresh = () => fetch(params.value)

  const filteredCoins = computed(() => {
    if (!searchQuery.value.trim()) return coins.value
    const query = searchQuery.value.toLowerCase()
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
    error,
    lastUpdated,
    searchQuery,
    refresh,
    updateParams,
    fetch
  }
}