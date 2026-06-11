// Скопируйте в config.js и укажите свои ключи перед публикацией на хостинг.
// Для локального запуска используйте файл .env (создаётся автоматически).
window.SITE_CONFIG = {
    // Необязательно: без ключа карта всё равно работает (Leaflet + виджет Яндекса)
    yandexMapsApiKey: '',

    // ⚠ Для локального запуска Telegram настройки читаются из .env файла
    // (TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID).
    // На Vercel задайте эти же переменные в Project Settings → Environment Variables.
};