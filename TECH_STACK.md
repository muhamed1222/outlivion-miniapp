# ⚠️ TECH STACK - OUTLIVION MINIAPP

> **🚨 ВНИМАНИЕ: НЕ УДАЛЯТЬ ЭТОТ ФАЙЛ!**  
> Эта документация критически важна для понимания архитектуры проекта.

---

## 🎯 Назначение
Unified Frontend - Telegram Mini App + Web Portal в одном проекте

---

## 🛠️ Технологии

### Core
- **Next.js 14** - React framework (App Router)
- **React 18** - UI библиотека
- **TypeScript** - Язык программирования
- **Port:** 3002 (dev) / Vercel (prod)

### Стилизация
- **TailwindCSS** - CSS framework
- **Framer Motion** - Анимации
- **class-variance-authority** - Варианты компонентов
- **clsx + tailwind-merge** - Утилиты для классов

### Telegram
- **telegraf** - Telegram Bot framework
- **Telegram WebApp API** - Mini App интеграция
- `window.Telegram.WebApp` - Клиентское API

### Утилиты
- **axios** - HTTP клиент
- **qrcode.react** - QR коды для VLESS
- **js-cookie** - Cookie management

---

## 🏗️ Архитектура проекта

### Unified Frontend Approach
```
/                  → Auto-redirect (определяет среду)
/telegram/*        → Telegram Mini App (компактный UI)
/web/*             → Web Portal (полноразмерный UI)
/api/bot/          → Telegram Bot webhook
```

### Преимущества
- ✅ Единая кодовая база
- ✅ Максимальное переиспользование компонентов
- ✅ Автоопределение среды
- ✅ Single deployment

---

## 📁 Структура

```
src/
├── app/
│   ├── telegram/          # 🤖 Mini App (NavigationBar)
│   │   ├── page.tsx       # Home
│   │   ├── billing/       # Оплата
│   │   ├── servers/       # Серверы
│   │   ├── config/        # Конфигурация
│   │   ├── promo/         # Промокоды
│   │   └── subscription/  # Подписка
│   │
│   ├── web/               # 🌐 Web Portal (Header/Footer)
│   │   ├── page.tsx       # Landing/Dashboard
│   │   ├── login/         # Login
│   │   └── ...
│   │
│   └── api/
│       └── bot/           # Telegram webhook
│
├── components/
│   ├── telegram/          # Telegram-specific
│   ├── web/               # Web-specific
│   └── ui/                # Shared UI
│
├── lib/
│   ├── api.ts             # API client
│   ├── auth.ts            # Auth utilities
│   ├── bot.ts             # Telegram Bot
│   └── telegram.ts        # WebApp API
│
└── hooks/
    └── useEnvironment.ts  # Environment detection
```

---

## 🔗 Интеграции

### 1. Outlivion API
```env
NEXT_PUBLIC_API_URL=https://api.outlivion.space
```
- REST endpoints для всех операций
- JWT аутентификация
- Telegram initData validation

### 2. Telegram Bot
```env
TELEGRAM_BOT_TOKEN=8477147639:AAEVS_D_A4avYXPOku78AWiYbiirOgglpbw
TELEGRAM_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_TELEGRAM_BOT_NAME=outlivionbot
```
- Webhook: `/api/bot/route.ts`
- Команды: `/start`, `/status`, `/help`
- Menu Button → Mini App URL

### 3. Telegram WebApp API
```typescript
// Клиентская интеграция
window.Telegram.WebApp.ready()
window.Telegram.WebApp.initData  // Для авторизации
window.Telegram.WebApp.expand()
window.Telegram.WebApp.HapticFeedback
```

---

## 🔐 Аутентификация

### Telegram Mini App
```typescript
// lib/auth.ts - unified auth
1. Получаем initData из Telegram WebApp
2. Отправляем на backend: POST /auth/telegram
3. Получаем JWT tokens
4. Сохраняем в localStorage (Mini App) или cookies (Web)
```

### Web Portal
- Telegram Login Widget (TODO Phase 3)
- Session через HttpOnly cookies
- JWT tokens от API

---

## 🚀 Deployment

### Platform: Vercel
- URL: https://app.outlivion.space
- Framework: Next.js
- Region: iad1
- Auto-deploy из GitHub

### Telegram Bot Setup
```bash
# В @BotFather
/setmenubutton
Button text: 🚀 Открыть Mini App
Web App URL: https://app.outlivion.space/telegram

# Webhook (автоматически)
https://app.outlivion.space/api/bot
```

---

## 🔐 Критические переменные окружения

```env
# API (ОБЯЗАТЕЛЬНО!)
NEXT_PUBLIC_API_URL=https://api.outlivion.space

# Telegram Bot (для сервера)
TELEGRAM_BOT_TOKEN=8477147639:AAEVS_D_A4avYXPOku78AWiYbiirOgglpbw
TELEGRAM_WEBHOOK_SECRET=your_webhook_secret

# Telegram (для клиента)
NEXT_PUBLIC_TELEGRAM_BOT_NAME=outlivionbot
NEXT_PUBLIC_MINIAPP_URL=https://bot.outlivion.space

# Environment
NODE_ENV=production
```

---

## 📱 Telegram Mini App Features

### UI Components
- **NavigationBar** - Нижняя навигация (4 вкладки)
- **Haptic Feedback** - Тактильная отдача
- **Theme Colors** - Цвета из Telegram темы
- **Safe Area** - Учет вырезов экрана

### Страницы
```
/telegram               → Home (баланс, подписка, серверы)
/telegram/billing       → Выбор тарифа + оплата
/telegram/servers       → Список VPN серверов
/telegram/config/:id    → VLESS конфиг + QR код
/telegram/subscription  → Управление подпиской
/telegram/promo         → Активация промокодов
```

---

## 🌐 Web Portal Features

### Страницы (Phase 2 - ГОТОВО)
```
/web                    → Landing / Redirect
/web/login              → Авторизация
/web/dashboard          → Личный кабинет
/web/billing            → Оплата
/web/servers            → Серверы
/web/config/:id         → Конфигурация
/web/subscription       → Подписка
/web/transactions       → История платежей
/web/promo              → Промокоды
```

---

## 🔄 Middleware Protection

```typescript
// src/middleware.ts
Protected routes:
- /telegram/billing
- /telegram/servers
- /telegram/config/*
- /telegram/subscription
- /telegram/promo

- /web/dashboard
- /web/billing
- /web/profile
- /web/config/*
```

Auto-redirect на login если не авторизован.

---

## 🤖 Bot Webhook Handler

```typescript
// src/app/api/bot/route.ts

Обрабатывает:
1. /start - Создание пользователя в API
2. /status - Проверка подписки
3. /help - Справка
4. Callback queries (inline buttons)
5. Webhook secret verification
```

**Интеграция с API:**
- `POST /auth/telegram` - создание пользователя
- `GET /user/subscription?telegramId=xxx` - статус

---

## ⚡ Команды

```bash
npm run dev              # Разработка (port 3002)
npm run build            # Production build
npm start                # Production server
npm run setup:webhook    # Настроить Telegram webhook
npm run bot:diagnostics  # Диагностика бота
```

---

## 📝 Важные заметки

1. **HTTPS обязателен** - Telegram требует SSL
2. **CSP Headers** - `frame-ancestors` для Telegram
3. **initData validation** - проверка на backend
4. **Dual storage** - localStorage (Telegram) / cookies (Web)
5. **Environment detection** - `window.Telegram.WebApp`
6. **Haptic feedback** - легкая вибрация на действия
7. **Navigation Bar** - только для Telegram Mini App

---

## 🔗 Связи с другими компонентами

```
Telegram Bot
    ↓ Webhook
Mini App (/api/bot)
    ↓ REST API + JWT
API (api.outlivion.space)
    ↓
Neon PostgreSQL + Marzban + Mercuryo
```

---

**Версия:** 2.0.0 (Unified)  
**Последнее обновление:** Декабрь 2025  
**Платформа:** Vercel  
**Status:** ✅ Production Ready

