# 📋 Как посмотреть логи Telegram бота

## 🎯 Быстрый старт

Ваш бот развернут на **Vercel**, поэтому логи можно посмотреть несколькими способами.

---

## 📊 Способ 1: Vercel CLI (Рекомендуется)

### Просмотр логов в реальном времени

```bash
cd /Users/kelemetovmuhamed/Documents/outlivion-new/outlivion-miniapp

# 1. Получить список последних деплойментов
vercel ls

# 2. Посмотреть логи конкретного деплоймента (используйте URL из списка выше)
vercel logs https://outlivion-miniapp-9nidyc3ah-muhameds-projects-9d998835.vercel.app

# 3. Или логи в формате JSON (удобно для фильтрации)
vercel logs https://outlivion-miniapp-9nidyc3ah-muhameds-projects-9d998835.vercel.app --json

# 4. Фильтрация только логов бота (если установлен jq)
vercel logs https://outlivion-miniapp-9nidyc3ah-muhameds-projects-9d998835.vercel.app --json | jq 'select(.message | contains("[BOT]"))'
```

### Просмотр логов production деплоймента

```bash
# Если у вас настроен production домен
vercel logs https://app.outlivion.space

# Или через project name
vercel logs --follow
```

---

## 🌐 Способ 2: Vercel Dashboard (Веб-интерфейс) ⭐ РЕКОМЕНДУЕТСЯ

### Быстрый доступ к логам бота:

1. Откройте [Vercel Dashboard](https://vercel.com/dashboard)
2. Выберите проект **outlivion-miniapp**
3. Перейдите на вкладку **"Deployments"**
4. Выберите нужный деплоймент (или production: `app.outlivion.space`)
5. Нажмите на вкладку **"Logs"** или **"Functions"**
6. В поле фильтрации введите: `/api/bot`
7. Логи будут отображаться в реальном времени

### Что вы увидите в логах:

```
Dec 03 20:16:10.69  GET  405  app.outlivion.space  /api/bot
```
**Объяснение:**
- `GET` - метод запроса (обычно это проверка доступности)
- `405` - Method Not Allowed (нормально, бот принимает только POST)
- `app.outlivion.space` - ваш домен
- `/api/bot` - путь к webhook

**Успешные запросы от Telegram:**
```
Dec 03 20:20:01.30  POST  200  app.outlivion.space  /api/bot
```

**Runtime логи (console.log):**
- Нажмите на конкретный запрос
- Прокрутите вниз до раздела **"Runtime Logs"**
- Там будут видны все `console.log('[BOT] ...')` сообщения

**Прямая ссылка:**
```
https://vercel.com/[your-team]/outlivion-miniapp/deployments
```

---

## 🔍 Способ 3: Фильтрация логов бота

Ваш бот использует префикс `[BOT]` для всех логов. Вот примеры фильтрации:

### Фильтрация по пути `/api/bot` (Vercel Dashboard)

В Vercel Dashboard вы можете фильтровать логи по пути:
- Найдите поле фильтрации
- Введите: `/api/bot`
- Вы увидите все запросы к боту

**Важно:** 
- `GET /api/bot` → `405` - это нормально! Бот принимает только POST запросы
- `POST /api/bot` → `200` - успешные webhook запросы от Telegram
- `POST /api/bot` → `401` - проблема с авторизацией (проверьте secret token)
- `POST /api/bot` → `500` - ошибка в коде бота (смотрите runtime logs)

### Через grep (локально)
```bash
# Все запросы к /api/bot
vercel logs https://app.outlivion.space | grep "/api/bot"

# Только логи с префиксом [BOT]
vercel logs https://app.outlivion.space | grep "\[BOT\]"

# Комбинированная фильтрация
vercel logs https://app.outlivion.space | grep -E "/api/bot|\[BOT\]"
```

### Через jq (JSON формат)
```bash
# Все запросы к /api/bot
vercel logs https://app.outlivion.space --json | jq 'select(.path == "/api/bot")'

# Все логи бота (runtime logs)
vercel logs https://app.outlivion.space --json | jq 'select(.message | contains("[BOT]"))'

# Только POST запросы к боту
vercel logs https://app.outlivion.space --json | jq 'select(.path == "/api/bot" and .method == "POST")'

# Только ошибки бота
vercel logs https://app.outlivion.space --json | jq 'select(.message | contains("[BOT]") and .level == "error")'

# Логи отправки сообщений
vercel logs https://app.outlivion.space --json | jq 'select(.message | contains("[BOT] Sending message"))'

# Комбинированная фильтрация: запросы + runtime logs
vercel logs https://app.outlivion.space --json | jq 'select(.path == "/api/bot" or (.message | contains("[BOT]")))'
```

---

## 📝 Типы логов бота

Ваш бот логирует следующие события:

### 1. Входящие сообщения
```
[BOT] Received message: { chatId: ..., text: ..., from: ... }
[BOT] Message handled successfully
```

### 2. Callback запросы (нажатия кнопок)
```
[BOT] Received callback: faq
```

### 3. Отправка сообщений
```
[BOT] Sending message to Telegram API: { chatId: ..., textLength: ... }
[BOT] Request body: { ... }
[BOT] Telegram API response: { ok: true, status: 200 }
```

### 4. Ошибки
```
[BOT] Error handling message: ...
[BOT] Error in handleStartCommand: ...
[BOT] Telegram API error details: ...
```

---

## 🛠️ Способ 4: Локальная разработка

Если вы запускаете бота локально:

```bash
cd /Users/kelemetovmuhamed/Documents/outlivion-new/outlivion-miniapp
npm run dev

# Логи будут отображаться прямо в терминале
# Все логи с префиксом [BOT] будут видны
```

---

## 🚀 Способ 5: Мониторинг в реальном времени

### Создайте скрипт для мониторинга

Создайте файл `watch-bot-logs.sh`:

```bash
#!/bin/bash
# watch-bot-logs.sh

DEPLOYMENT_URL=$(vercel ls --json | jq -r '.[0].url')

echo "🔍 Мониторинг логов бота..."
echo "📍 Deployment: $DEPLOYMENT_URL"
echo ""

vercel logs "$DEPLOYMENT_URL" --json | jq -r 'select(.message | contains("[BOT]")) | "\(.timestamp) [\(.level)] \(.message)"'
```

Сделайте его исполняемым:
```bash
chmod +x watch-bot-logs.sh
./watch-bot-logs.sh
```

---

## 📊 Способ 6: Vercel Analytics (Production)

Для production мониторинга:

1. Включите **Vercel Analytics** в настройках проекта
2. Перейдите в раздел **"Analytics"** → **"Logs"**
3. Используйте фильтры для поиска логов бота

---

## 🔧 Полезные команды

```bash
# Список всех деплойментов
vercel ls

# Информация о проекте
vercel inspect

# Логи последнего деплоймента (если настроен production)
vercel logs --follow

# Логи конкретного деплоймента по ID
vercel logs dpl_xxxxxxxxxxxxx

# Логи в формате JSON
vercel logs [url] --json > logs.json
```

---

## 🐛 Отладка проблем

### Анализ ваших текущих логов:

Из ваших логов видно:
```
Dec 03 20:16:10.69  GET  405  app.outlivion.space  /api/bot
```

**Это нормально!** 
- `405 Method Not Allowed` означает, что кто-то попытался сделать GET запрос
- Ваш бот правильно отклоняет GET запросы (принимает только POST)
- Telegram отправляет POST запросы, поэтому они будут успешными

### Если логи не отображаются:

1. **Проверьте, что деплоймент активен:**
   ```bash
   vercel ls
   ```

2. **Проверьте, что бот получает запросы:**
   - Отправьте сообщение боту в Telegram (например, `/start`)
   - Сразу после этого проверьте логи в Vercel Dashboard
   - Фильтруйте по `/api/bot` и ищите POST запросы

3. **Проверьте функцию API:**
   ```bash
   # Логи только для функции /api/bot
   vercel logs https://app.outlivion.space --json | jq 'select(.path == "/api/bot")'
   ```

4. **Проверьте runtime логи (console.log):**
   - В Vercel Dashboard откройте конкретный POST запрос к `/api/bot`
   - Прокрутите до раздела "Runtime Logs"
   - Там должны быть видны все `[BOT]` логи

### Типичные проблемы:

**Проблема: Нет POST запросов к `/api/bot`**
- **Причина:** Webhook не настроен или настроен неправильно
- **Решение:** Проверьте webhook через `getWebhookInfo` API

**Проблема: POST запросы возвращают 401**
- **Причина:** Проблема с secret token
- **Решение:** Проверьте `TELEGRAM_WEBHOOK_SECRET` в environment variables

**Проблема: POST запросы возвращают 500**
- **Причина:** Ошибка в коде бота
- **Решение:** Смотрите Runtime Logs для деталей ошибки

---

## 📱 Проверка через Telegram

Чтобы увидеть логи в действии:

1. Откройте вашего бота в Telegram
2. Отправьте команду `/start`
3. Сразу после этого выполните:
   ```bash
   vercel logs [your-deployment-url] | grep "\[BOT\]"
   ```

Вы должны увидеть:
```
[BOT] Received message: { chatId: ..., text: '/start', from: '...' }
[BOT] handleStartCommand: { chatId: ..., firstName: '...', miniAppUrl: '...' }
[BOT] Sending message to Telegram API: { chatId: ..., textLength: ... }
[BOT] Message sent successfully
```

---

## 🎯 Быстрая команда для ежедневного использования

### Вариант 1: Production домен (рекомендуется)

Добавьте в ваш `.zshrc` или `.bashrc`:

```bash
# Логи бота с production домена
alias bot-logs='cd /Users/kelemetovmuhamed/Documents/outlivion-new/outlivion-miniapp && vercel logs https://app.outlivion.space | grep -E "/api/bot|\[BOT\]"'

# Только запросы к боту
alias bot-requests='cd /Users/kelemetovmuhamed/Documents/outlivion-new/outlivion-miniapp && vercel logs https://app.outlivion.space | grep "/api/bot"'

# Только runtime логи бота
alias bot-runtime='cd /Users/kelemetovmuhamed/Documents/outlivion-new/outlivion-miniapp && vercel logs https://app.outlivion.space --json | jq -r "select(.message | contains(\"[BOT]\")) | \"\(.timestamp) [\(.level)] \(.message)\""'
```

Теперь просто выполните:
```bash
bot-logs        # Все логи бота (запросы + runtime)
bot-requests     # Только HTTP запросы к /api/bot
bot-runtime      # Только console.log сообщения с [BOT]
```

### Вариант 2: Последний деплоймент

```bash
alias bot-logs-latest='cd /Users/kelemetovmuhamed/Documents/outlivion-new/outlivion-miniapp && vercel logs $(vercel ls --json 2>/dev/null | jq -r ".[0].url") | grep -E "/api/bot|\[BOT\]"'
```

### Применение изменений:

После добавления в `.zshrc`:
```bash
source ~/.zshrc
# или просто откройте новый терминал
```

---

## 📚 Дополнительные ресурсы

- [Vercel Logs Documentation](https://vercel.com/docs/monitoring/logs)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Telegram Bot API Logging](https://core.telegram.org/bots/api)

---

**Последнее обновление:** 2024

