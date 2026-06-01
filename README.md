# CryptoTracker

Приложение для отслеживания топ-10 криптовалют в реальном времени. Построено на Vue 3 + Vite с использованием публичного CoinGecko API.

## Демо
🔗 [https://crypto-tracker-yourname.vercel.app](https://crypto-tracker-yourname.vercel.app)

## Технологии
- Vue 3 (Composition API, `<script setup>`)
- Vite (сборка, HMR)
- CoinGecko Public API (данные)
- localStorage (кэширование)
- CSS Variables + Scoped Styles (стилизация)

## Установка и запуск локально

```bash
# 1. Клонировать репозиторий
git clone <your-repo-url>
cd lab_3.4

# 2. Установить зависимости
npm install

# 3. Создать файл окружения (опционально, для расширения)
cp .env.example .env.local
# Отредактировать .env.local при необходимости

# 4. Запустить дев-сервер
npm run dev

# 5. Открыть в браузере
# → http://localhost:5173