# 🚀 Outlivion MiniApp - Quick Start

Быстрый старт для запуска Telegram MiniApp локально.

## 📋 Требования

- Node.js 18+
- npm или pnpm
- Backend API (должен быть запущен на localhost:3001 или указан в .env)

## 🔧 Установка

### 1. Установите зависимости

```bash
cd apps/miniapp
npm install
```

### 2. Настройте переменные окружения

Создайте файл `.env.local`:

```bash
cp .env.example .env.local
```

Отредактируйте `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_TELEGRAM_BOT_NAME=outlivionbot
NODE_ENV=development
```

### 3. Запустите приложение

```bash
npm run dev
```

Приложение будет доступно на http://localhost:3002

## 🧪 Разработка

### Локальное тестирование (вне Telegram)

Приложение поддерживает работу в development режиме вне Telegram с mock данными:

- Mock пользователь автоматически создаётся
- Все Telegram WebApp API вызовы логируются в консоль
- initData заменяется на mock данные

### Тестирование в Telegram

Для тестирования в реальном Telegram:

1. **Создайте бота через @BotFather**
   ```
   /newbot
   ```

2. **Получите Bot Token**

3. **Настройте Web App URL**
   - Используйте ngrok или cloudflare tunnel для публичного URL
   - В @BotFather выполните:
   ```
   /setmenubutton
   [выберите вашего бота]
   Введите название кнопки: Открыть VPN
   Введите URL: https://your-public-url.com
   ```

4. **Настройте домен в Telegram**
   ```
   /setdomain
   [выберите вашего бота]
   Введите домен: your-public-url.com
   ```

#### Использование ngrok для тестирования

```bash
# Установите ngrok
brew install ngrok  # macOS
# или скачайте с https://ngrok.com

# Запустите туннель
ngrok http 3002

# Скопируйте HTTPS URL и используйте его в настройках бота
```

## 🏗️ Сборка для Production

```bash
npm run build
npm start
```

## 🐳 Docker

### Сборка образа

```bash
docker build -t outlivion-miniapp .
```

### Запуск контейнера

```bash
docker run -p 3002:3002 \
  -e NEXT_PUBLIC_API_URL=http://backend:3001 \
  outlivion-miniapp
```

## 📱 Структура проекта

```
apps/miniapp/
├── src/
│   ├── app/                    # Next.js App Router страницы
│   │   ├── page.tsx           # Главная
│   │   ├── subscription/      # Подписка
│   │   ├── servers/           # Серверы
│   │   ├── config/[id]/       # Конфигурация
│   │   ├── billing/           # Оплата
│   │   └── promo/             # Промокоды
│   ├── components/            # React компоненты
│   │   ├── ui/               # UI компоненты
│   │   ├── navigation-bar.tsx # Навигация
│   │   └── telegram-provider.tsx # Telegram контекст
│   ├── lib/                   # Утилиты
│   │   ├── telegram.ts       # Telegram WebApp API
│   │   ├── api.ts            # Backend API клиент
│   │   └── utils.ts          # Вспомогательные функции
│   └── styles/               # Стили
│       └── globals.css
├── public/                    # Статические файлы
├── Dockerfile                 # Docker конфигурация
└── package.json
```

## 🔑 Основные функции

### Telegram WebApp Integration

```typescript
import { 
  initTelegramWebApp, 
  getTelegramUser,
  showMainButton,
  hapticImpact 
} from '@/lib/telegram';

// Инициализация
const webApp = initTelegramWebApp();

// Получение пользователя
const user = getTelegramUser();

// Показ главной кнопки
showMainButton('Продолжить', () => {
  console.log('Button clicked');
});

// Вибрация
hapticImpact('medium');
```

### API Calls

```typescript
import { userApi, serverApi, billingApi } from '@/lib/api';

// Получение пользователя
const user = await userApi.getUser();

// Получение серверов
const servers = await serverApi.getServers();

// Создание платежа
const payment = await billingApi.createPayment({
  plan: 'monthly',
});
```

## 🎨 Кастомизация

### Цвета (tailwind.config.js)

```javascript
colors: {
  primary: {
    main: '#F55128',
    light: '#FF7A5A',
    dark: '#D63E1A',
  },
  // ... другие цвета
}
```

### Telegram Theme

Приложение автоматически применяет цвета темы Telegram через `Telegram.WebApp.themeParams`.

## 🐛 Отладка

### Включение логов

```typescript
// В lib/telegram.ts измените console.log на console.debug
console.debug('Telegram WebApp initialized');
```

### Просмотр Network запросов

Откройте DevTools → Network для просмотра API запросов.

### Mock данные

В development режиме используются mock данные. См. `lib/telegram.ts` → `getMockTelegramData()`.

## 📚 Документация

- [Telegram WebApp API](https://core.telegram.org/bots/webapps)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🆘 Помощь

При возникновении проблем:

1. Проверьте консоль браузера на ошибки
2. Убедитесь, что backend запущен
3. Проверьте переменные окружения
4. Проверьте сетевые запросы в DevTools

## 📄 Лицензия

Private

