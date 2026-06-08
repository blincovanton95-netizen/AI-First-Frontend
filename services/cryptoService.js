const API_BASE_URL = 'https://api.coingecko.com/api/v3';
const CACHE_TTL = 5 * 60 * 1000; // 5 минут
const CACHE_PREFIX = 'cryptocache:v1:';

const toApiParams = ({
  vsCurrency = 'usd',
  order = 'market_cap_desc',
  perPage = 10,
  page = 1,
} = {}) => ({
  vs_currency: vsCurrency,
  order,
  per_page: perPage,
  page,
  sparkline: 'false',
});

const buildCacheKey = (params) => {
  const sorted = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
  return `${CACHE_PREFIX}${btoa(sorted)}`;
};

const getCachedData = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { timestamp, data } = JSON.parse(raw);
    return Date.now() - timestamp < CACHE_TTL ? data : null;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
};

const getStaleCachedData = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data } = JSON.parse(raw);
    return data ?? null;
  } catch {
    return null;
  }
};

const setCachedData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), data }));
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      Object.keys(localStorage)
        .filter(k => k.startsWith(CACHE_PREFIX))
        .map(k => ({ key: k, ts: JSON.parse(localStorage[k]).timestamp }))
        .sort((a, b) => a.ts - b.ts)
        .slice(0, 3)
        .forEach(item => localStorage.removeItem(item.key));
      try {
        localStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), data }));
      } catch {
        // ignore if storage is still full
      }
    }
  }
};

/**
 * Синхронно читает кэш для мгновенного отображения (stale-while-revalidate).
 */
export const readCachedTopCryptos = (options = {}) => {
  if (typeof localStorage === 'undefined') {
    return { data: null, isStale: false };
  }
  const params = toApiParams(options);
  const cacheKey = buildCacheKey(params);
  const fresh = getCachedData(cacheKey);
  if (fresh) return { data: fresh, isStale: false };
  const stale = getStaleCachedData(cacheKey);
  if (stale) return { data: stale, isStale: true };
  return { data: null, isStale: false };
};

/**
 * Получает топ криптовалют с кэшированием
 */
export const fetchTopCryptos = async (options = {}) => {
  const params = toApiParams(options);
  const cacheKey = buildCacheKey(params);

  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const url = `${API_BASE_URL}/coins/markets?${new URLSearchParams(params).toString()}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 429) throw new Error('Слишком много запросов. Попробуйте позже.');
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    const stale = getStaleCachedData(cacheKey);
    if (stale) return stale;

    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Ошибка сети. Проверьте подключение к интернету.');
    }
    throw error;
  }
};

export const fetchCryptoDetails = async (coinId) => {
  const response = await fetch(`${API_BASE_URL}/coins/${coinId}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
};
