# Outlivion MiniApp - Development Guide

## Архитектура

### Отличия от Portal

MiniApp создан на основе Portal, но имеет ключевые отличия:

| Аспект | Portal | MiniApp |
|--------|--------|---------|
| **Авторизация** | Telegram Login Widget + Cookies | Telegram initData |
| **Хранение токенов** | Cookies (js-cookie) | Headers (X-Telegram-Init-Data) |
| **Routing** | Next.js App Router (SSR) | Next.js App Router (Client-only) |
| **Навигация** | Browser redirects | Client-side navigation |
| **UI** | Desktop + Mobile | Mobile-first |
| **Тема** | Custom dark theme | Telegram theme integration |
| **Кнопки** | Standard HTML buttons | Telegram MainButton/BackButton |
| **Feedback** | Toast notifications | Haptic feedback + Toasts |

### Структура API

```
Backend API
    ↓
/miniapp/* endpoints
    ↓
X-Telegram-Init-Data header
    ↓
Backend verifies Telegram signature
    ↓
Returns data
```

### Авторизация Flow

```
1. User opens MiniApp in Telegram
2. Telegram.WebApp.initData contains signed user data
3. MiniApp sends initData to backend in header
4. Backend verifies signature using Bot Token
5. Backend returns user data
6. All subsequent requests include initData header
```

## 🔧 Development Setup

### Prerequisites

1. **Backend API** должен поддерживать `/miniapp/*` endpoints
2. **Telegram Bot Token** для проверки подписи initData
3. **Node.js 18+** для запуска MiniApp

### Local Development

#### 1. Запуск без Telegram (Mock режим)

```bash
npm run dev
```

- Автоматически использует mock данные
- Все Telegram API вызовы логируются
- Удобно для быстрой разработки UI

#### 2. Тестирование в Telegram

Используйте ngrok или cloudflare tunnel:

```bash
# Ngrok
ngrok http 3002

# Cloudflare Tunnel
cloudflared tunnel --url http://localhost:3002
```

Настройте Web App URL в @BotFather:

```
/setmenubutton
[Bot Name]
Button text: Открыть VPN
Web App URL: https://your-tunnel-url.com
```

### Environment Variables

```env
# Required
NEXT_PUBLIC_API_URL=http://localhost:3001

# Optional
NEXT_PUBLIC_TELEGRAM_BOT_NAME=outlivionbot
NODE_ENV=development
```

## 📁 Code Organization

### /src/lib/telegram.ts

Содержит всю логику работы с Telegram WebApp API:

- `initTelegramWebApp()` - инициализация
- `getTelegramUser()` - получение пользователя
- `getTelegramInitData()` - получение initData для API
- `showMainButton()`, `hideMainButton()` - управление кнопками
- `hapticImpact()`, `hapticNotification()` - вибрация
- Mock данные для разработки

### /src/lib/api.ts

API клиент с автоматической отправкой initData:

```typescript
// Request interceptor добавляет X-Telegram-Init-Data header
api.interceptors.request.use((config) => {
  const initData = getTelegramInitData();
  if (initData) {
    config.headers['X-Telegram-Init-Data'] = initData;
  }
  return config;
});
```

### /src/components/telegram-provider.tsx

Provider для инициализации Telegram WebApp при загрузке приложения.

### /src/app/*

Все страницы помечены как `'use client'` - нет SSR.

## 🎨 Styling

### Telegram Theme Integration

Приложение автоматически применяет цвета темы Telegram:

```typescript
// lib/telegram.ts
export function applyTelegramTheme(webApp: TelegramWebApp): void {
  const theme = webApp.themeParams;
  const root = document.documentElement;
  
  if (theme.bg_color) {
    root.style.setProperty('--tg-bg-color', theme.bg_color);
  }
  // ...
}
```

CSS переменные доступны в `globals.css`:

```css
:root {
  --tg-bg-color: #000000;
  --tg-text-color: #ffffff;
  --tg-button-color: #F55128;
  /* ... */
}
```

### Mobile-First Design

Все компоненты оптимизированы для мобильных:

- Крупные кнопки (min-height: 48px)
- Крупные touch-области
- Адаптивные карточки
- Фиксированная навигация снизу

## 🧪 Testing

### Unit Testing (Future)

```bash
npm test
```

### E2E Testing (Future)

```bash
npm run test:e2e
```

### Manual Testing Checklist

- [ ] Открывается в Telegram
- [ ] Показывает корректные данные пользователя
- [ ] Работает навигация
- [ ] Haptic feedback срабатывает
- [ ] API запросы успешны
- [ ] QR коды генерируются
- [ ] Копирование в буфер работает
- [ ] Оплата перенаправляет корректно

## 🐛 Common Issues

### Issue: "Telegram WebApp не найден"

**Solution:**
- Убедитесь, что скрипт загружен: `<script src="https://telegram.org/js/telegram-web-app.js">`
- В development режиме используются mock данные автоматически

### Issue: "API возвращает 401 Unauthorized"

**Solution:**
- Проверьте, что backend получает `X-Telegram-Init-Data` header
- Проверьте, что backend корректно проверяет подпись
- В development убедитесь, что используется mock initData

### Issue: "initData пустой"

**Solution:**
- Проверьте, что приложение запущено в Telegram
- В development режиме mock данные используются автоматически
- Проверьте консоль на ошибки инициализации

### Issue: "Haptic feedback не работает"

**Solution:**
- Haptic работает только в реальном Telegram
- На desktop версии Telegram может не работать
- Проверьте настройки вибрации в телефоне

## 🚀 Deployment

### Vercel

```bash
vercel --prod
```

Настройте Environment Variables в Vercel dashboard.

### Docker

```bash
docker build -t outlivion-miniapp .
docker run -p 3002:3002 \
  -e NEXT_PUBLIC_API_URL=https://api.outlivion.com \
  outlivion-miniapp
```

### Docker Compose

```yaml
version: '3.8'
services:
  miniapp:
    build: ./apps/miniapp
    ports:
      - "3002:3002"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:3001
    depends_on:
      - backend
```

## 📊 Performance

### Bundle Size

Оптимизация:
- Tree-shaking неиспользуемого кода
- Dynamic imports для тяжёлых компонентов
- Image optimization через next/image

### Loading Time

- Используйте `Loading` компонент для асинхронных операций
- Показывайте skeleton screens
- Prefetch данные где возможно

## 🔐 Security

### Input Validation

Все пользовательские вводы валидируются:

```typescript
const promoCode = input.trim().toUpperCase().slice(0, 20);
```

### XSS Protection

Next.js автоматически экранирует вывод.

### API Security

- initData подпись проверяется backend
- HTTPS обязателен в production
- Rate limiting на backend

## 📱 Platform Specific

### iOS

- Проверьте `safe-area-inset` для notch
- Используйте `-webkit-` префиксы где нужно
- Тестируйте в Safari

### Android

- Проверьте работу на разных размерах экранов
- Тестируйте разные версии Android WebView
- Проверьте поддержку Haptic

## 🔄 Migration from Portal

При добавлении новой функции из Portal:

1. **Удалите SSR зависимости**
   - Удалите `getServerSideProps`
   - Добавьте `'use client'`
   - Замените `cookies()` на headers

2. **Адаптируйте авторизацию**
   - Замените cookies на initData
   - Обновите API calls

3. **Адаптируйте UI**
   - Увеличьте кнопки
   - Добавьте haptic feedback
   - Проверьте на мобильных

## 📚 Resources

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Telegram WebApp API](https://core.telegram.org/bots/webapps)
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🤝 Contributing

1. Создайте feature branch
2. Внесите изменения
3. Тестируйте в Telegram
4. Создайте Pull Request

## 📄 License

Private

