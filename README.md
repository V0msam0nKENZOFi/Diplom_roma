# ТехноСервис+

Сайт сервисного центра по ремонту оргтехники (HTML, CSS, JavaScript).

## Быстрый старт (локально)

```bash
npm install
npm start
```

Откройте в браузере: http://localhost:3000

## Настройка перед публикацией

1. Скопируйте `config.example.js` → `config.js` (если файла ещё нет).
2. Заполните в `config.js` при необходимости:

```javascript
window.SITE_CONFIG = {
    yandexMapsApiKey: 'ваш-ключ-яндекс-карт',
    telegramBotToken: 'токен-бота',
    telegramChatId: 'id-чата'
};
```

- Без ключей сайт работает: формы покажут успех локально, карта и Telegram не подключены.
- **Не публикуйте** реальные токены в открытый репозиторий.

## Вход администратора

- Email: `admin@technoservice.ru`
- Пароль: `admin123`

## Структура проекта

| Файл | Назначение |
|------|------------|
| `index.html` | Главная страница |
| `about.html` | О компании |
| `style.css` | Стили |
| `script.js` | Логика сайта |
| `config.js` | Ключи API (карты, Telegram) |
| `server.js` | Сервер для хостинга |
| `render.yaml` | Автодеплой на Render |

## Деплой на Render (рекомендуется)

1. Загрузите проект на **GitHub** (весь каталог `диплом`).
2. Зайдите на [render.com](https://render.com) → **New** → **Blueprint** или **Web Service**.
3. Подключите репозиторий.
4. Render подхватит `render.yaml` автоматически, либо укажите вручную:
   - **Runtime:** Node
   - **Build Command:** можно оставить пустым или `echo "ok"`
   - **Start Command:** `npm start`
5. После деплоя откройте выданный URL (`https://ваш-сайт.onrender.com`).

### GitHub + Render (команды)

```bash
cd "путь\к\диплом"
git init
git add .
git commit -m "Подготовка сайта к хостингу"
git branch -M main
git remote add origin https://github.com/ВАШ_ЛОГИН/technoservice-plus.git
git push -u origin main
```

## Другие хостинги

Любой хостинг с **Node.js** и командой `npm start` подойдёт (Railway, Fly.io и т.п.).

Чисто статический хостинг (GitHub Pages без Node) — загрузите файлы `index.html`, `about.html`, `style.css`, `script.js`, `config.js`; главная должна называться `index.html`.

## Проверка перед сдачей

- [ ] `npm install` и `npm start` — сайт открывается
- [ ] Работают страницы `index.html` и `about.html`
- [ ] На телефоне и ПК отображение корректное
- [ ] При необходимости заполнен `config.js`
