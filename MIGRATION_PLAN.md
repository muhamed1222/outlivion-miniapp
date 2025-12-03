# 🔄 План миграции: Объединение Portal и MiniApp

## 🎯 Цель
Объединить `outlivion-portal` и `outlivion-miniapp` в один проект с поддержкой двух режимов работы.

---

## 🏗️ Новая структура проекта

```
outlivion-app/
├── src/
│   ├── app/
│   │   ├── (telegram)/          # Telegram Mini App - Route Group
│   │   │   ├── layout.tsx       # Layout для Telegram (NavigationBar)
│   │   │   ├── page.tsx         # Home MiniApp
│   │   │   ├── billing/
│   │   │   │   └── page.tsx
│   │   │   ├── servers/
│   │   │   │   └── page.tsx
│   │   │   ├── config/
│   │   │   │   └── [serverId]/
│   │   │   │       └── page.tsx
│   │   │   ├── subscription/
│   │   │   │   └── page.tsx
│   │   │   └── promo/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (web)/               # Web Portal - Route Group
│   │   │   ├── layout.tsx       # Layout для Web (Header, Footer)
│   │   │   ├── page.tsx         # Landing page
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── billing/
│   │   │   │   ├── page.tsx
│   │   │   │   └── success/
│   │   │   ├── profile/
│   │   │   │   └── page.tsx
│   │   │   ├── config/
│   │   │   │   └── [serverId]/
│   │   │   ├── transactions/
│   │   │   │   └── page.tsx
│   │   │   ├── promo/
│   │   │   │   └── page.tsx
│   │   │   ├── terms/
│   │   │   │   └── page.tsx
│   │   │   └── faq/
│   │   │       └── page.tsx
│   │   │
│   │   ├── api/                 # API Routes (общие)
│   │   │   ├── bot/
│   │   │   │   └── route.ts
│   │   │   └── auth/
│   │   │       └── telegram/
│   │   │           └── route.ts
│   │   │
│   │   ├── layout.tsx           # Root Layout (общий)
│   │   ├── page.tsx             # Root → Auto-redirect
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── telegram/            # Telegram-специфичные
│   │   │   ├── navigation-bar.tsx
│   │   │   ├── telegram-provider.tsx
│   │   │   └── telegram-theme.tsx
│   │   ├── web/                 # Web-специфичные
│   │   │   ├── header.tsx
│   │   │   ├── footer.tsx
│   │   │   └── sidebar.tsx
│   │   ├── shared/              # Общие компоненты
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── loading.tsx
│   │   │   └── toast.tsx
│   │   └── ui/                  # UI библиотека
│   │       └── ...
│   │
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── index.ts         # Unified auth
│   │   │   ├── telegram.ts      # Telegram auth
│   │   │   └── session.ts       # Session management
│   │   ├── api/
│   │   │   ├── client.ts        # API client
│   │   │   └── endpoints.ts     # API endpoints
│   │   ├── telegram/
│   │   │   ├── index.ts         # Telegram WebApp API
│   │   │   └── bot.ts           # Bot utilities
│   │   ├── utils/
│   │   │   ├── environment.ts   # Environment detection
│   │   │   └── helpers.ts
│   │   └── constants.ts
│   │
│   ├── hooks/
│   │   ├── useEnvironment.ts    # Определение среды
│   │   ├── useTelegram.ts       # Telegram WebApp hooks
│   │   └── useAuth.ts           # Unified auth hook
│   │
│   ├── middleware.ts            # Route protection & redirects
│   └── styles/
│       └── globals.css
│
├── public/
│   ├── favicon.svg
│   └── telegram-web-app.js
│
└── ...config files
```

---

## 🔍 Логика определения среды

### 1. Environment Detection Utility

```typescript
// lib/utils/environment.ts

export type AppEnvironment = 'telegram' | 'web';

export function detectEnvironment(): AppEnvironment {
  // Серверный рендеринг - по умолчанию web
  if (typeof window === 'undefined') {
    return 'web';
  }

  // Проверяем наличие Telegram WebApp API
  if (window.Telegram?.WebApp) {
    return 'telegram';
  }

  return 'web';
}

export function isTelegramEnvironment(): boolean {
  return detectEnvironment() === 'telegram';
}

export function isWebEnvironment(): boolean {
  return detectEnvironment() === 'web';
}

// Получить базовый путь в зависимости от среды
export function getBasePath(): string {
  return isTelegramEnvironment() ? '/telegram' : '/web';
}
```

### 2. Root Page с Auto-Redirect

```typescript
// app/page.tsx

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { detectEnvironment } from '@/lib/utils/environment';
import { Loading } from '@/components/shared/loading';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const env = detectEnvironment();
    
    if (env === 'telegram') {
      router.replace('/telegram');
    } else {
      router.replace('/web');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loading size="lg" />
    </div>
  );
}
```

### 3. Middleware для защиты роутов

```typescript
// middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Пропускаем API routes, статику, _next
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value;
  const isAuthenticated = !!token;

  // Защищенные роуты Telegram
  const telegramProtectedRoutes = [
    '/telegram/billing',
    '/telegram/servers',
    '/telegram/config',
    '/telegram/subscription',
    '/telegram/promo',
  ];

  // Защищенные роуты Web
  const webProtectedRoutes = [
    '/web/dashboard',
    '/web/billing',
    '/web/profile',
    '/web/config',
    '/web/transactions',
    '/web/promo',
  ];

  // Проверка доступа к Telegram роутам
  const isTelegramProtected = telegramProtectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  if (isTelegramProtected && !isAuthenticated) {
    return NextResponse.redirect(new URL('/telegram', request.url));
  }

  // Проверка доступа к Web роутам
  const isWebProtected = webProtectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  if (isWebProtected && !isAuthenticated) {
    const loginUrl = new URL('/web/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

---

## 🔐 Единая авторизация через Telegram

### Unified Auth System

```typescript
// lib/auth/index.ts

import Cookies from 'js-cookie';
import { TelegramAuthData, validateTelegramAuth } from './telegram';
import { apiClient } from '@/lib/api/client';

export interface User {
  id: string;
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  balance?: number;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: User;
}

// Универсальная авторизация через Telegram
export async function loginWithTelegram(
  data: TelegramAuthData,
  source: 'miniapp' | 'widget' = 'miniapp'
): Promise<AuthResponse> {
  // Валидация на клиенте (опционально)
  if (source === 'widget' && !validateTelegramAuth(data)) {
    throw new Error('Invalid Telegram auth data');
  }

  // Отправка на сервер
  const response = await apiClient.post<AuthResponse>(
    '/auth/telegram',
    {
      ...data,
      source,
    }
  );

  // Сохранение токенов
  Cookies.set('token', response.token, { expires: 7 });
  if (response.refreshToken) {
    Cookies.set('refreshToken', response.refreshToken, { expires: 30 });
  }

  return response;
}

// Получить текущего пользователя
export async function getCurrentUser(): Promise<User | null> {
  try {
    const token = Cookies.get('token');
    if (!token) return null;

    const user = await apiClient.get<User>('/user');
    return user;
  } catch {
    return null;
  }
}

// Logout
export function logout() {
  Cookies.remove('token');
  Cookies.remove('refreshToken');
  
  if (typeof window !== 'undefined') {
    const env = detectEnvironment();
    window.location.href = env === 'telegram' ? '/telegram' : '/web/login';
  }
}

// Проверка аутентификации
export function isAuthenticated(): boolean {
  return !!Cookies.get('token');
}
```

---

## 📦 План миграции компонентов

### Этап 1: Подготовка структуры

1. ✅ Создать новые директории в `outlivion-miniapp`:
   - `app/(telegram)/` - для Mini App
   - `app/(web)/` - для Portal
   - `components/shared/` - общие компоненты
   - `components/telegram/` - специфичные для Telegram
   - `components/web/` - специфичные для Web

### Этап 2: Перенос компонентов

**Из Portal:**
```
portal/components/ui/ → miniapp/components/shared/
portal/components/layout/Header.tsx → miniapp/components/web/header.tsx
portal/lib/api.ts → miniapp/lib/api/client.ts (merge)
portal/lib/auth.ts → miniapp/lib/auth/index.ts (merge)
```

**Страницы Portal → Web routes:**
```
portal/app/dashboard/page.tsx → miniapp/app/(web)/dashboard/page.tsx
portal/app/billing/page.tsx → miniapp/app/(web)/billing/page.tsx
portal/app/profile/page.tsx → miniapp/app/(web)/profile/page.tsx
...и т.д.
```

**Страницы MiniApp → Telegram routes:**
```
miniapp/src/app/page.tsx → miniapp/app/(telegram)/page.tsx
miniapp/src/app/billing/ → miniapp/app/(telegram)/billing/
miniapp/src/app/servers/ → miniapp/app/(telegram)/servers/
...и т.д.
```

### Этап 3: Объединение UI компонентов

**Общие компоненты (используются везде):**
- Button
- Card
- Input
- Loading
- Toast

**Telegram-специфичные:**
- NavigationBar
- TelegramProvider
- Haptic feedback wrappers

**Web-специфичные:**
- Header с навигацией
- Footer
- Sidebar (если нужен)

### Этап 4: Унификация стилей

```css
/* globals.css - объединенные стили */

/* CSS Variables для обеих тем */
:root {
  /* Общие цвета */
  --primary: #0088cc;
  --background: #ffffff;
  --text: #000000;
  
  /* Telegram theme переменные */
  --tg-theme-bg-color: var(--background);
  --tg-theme-text-color: var(--text);
  --tg-theme-button-color: var(--primary);
}

/* Telegram WebApp стили */
.telegram-app {
  /* Специфичные стили для Mini App */
}

/* Web Portal стили */
.web-app {
  /* Специфичные стили для Web */
}
```

---

## 🔄 Миграция функционала

### 1. Авторизация

**Telegram Mini App:**
- Использует `window.Telegram.WebApp.initData`
- Автоматическая авторизация при открытии

**Web Portal:**
- Telegram Login Widget на `/web/login`
- Ручная авторизация пользователя

**Unified решение:**
```typescript
// hooks/useAuth.ts

export function useAuth() {
  const env = detectEnvironment();
  
  const loginWithTelegramMiniApp = async () => {
    const initData = getTelegramInitData();
    return loginWithTelegram(parseInitData(initData), 'miniapp');
  };
  
  const loginWithTelegramWidget = async (data: TelegramAuthData) => {
    return loginWithTelegram(data, 'widget');
  };
  
  return {
    login: env === 'telegram' ? loginWithTelegramMiniApp : null,
    loginWithWidget: loginWithTelegramWidget,
    logout,
    isAuthenticated: isAuthenticated(),
  };
}
```

### 2. Navigation

**Telegram:** Bottom NavigationBar  
**Web:** Top Header + Sidebar

```typescript
// Адаптивная навигация
{isTelegramEnvironment() ? (
  <NavigationBar />
) : (
  <Header />
)}
```

### 3. Payments

Единый компонент оплаты с адаптацией под среду:
```typescript
// components/shared/billing-form.tsx

export function BillingForm() {
  const env = detectEnvironment();
  const { showToast } = useToast();
  
  const handlePayment = async () => {
    const { paymentUrl } = await createPayment({...});
    
    if (env === 'telegram') {
      // Открыть в Telegram WebApp
      openTelegramLink(paymentUrl);
    } else {
      // Открыть в новой вкладке
      window.open(paymentUrl, '_blank');
    }
  };
  
  return <PaymentUI onSubmit={handlePayment} />;
}
```

---

## 🎨 UI/UX адаптация

### Telegram Mini App
- Использует нативные кнопки Telegram (MainButton, BackButton)
- Haptic feedback
- Тема от Telegram
- Компактный UI (max-width: 448px)

### Web Portal
- Полноразмерный дизайн
- Традиционная навигация
- Своя цветовая схема
- Адаптивный layout

### Общий код с условиями:

```typescript
import { isTelegramEnvironment } from '@/lib/utils/environment';

export function UniversalButton({ onClick, children }) {
  const isTelegram = isTelegramEnvironment();
  
  const handleClick = () => {
    if (isTelegram) {
      hapticImpact('light');
    }
    onClick();
  };
  
  return (
    <button
      onClick={handleClick}
      className={cn(
        'button',
        isTelegram ? 'telegram-button' : 'web-button'
      )}
    >
      {children}
    </button>
  );
}
```

---

## 📱 Routing Structure

### Telegram Mini App routes:
```
/telegram              → Home (balance, subscription status)
/telegram/billing      → Пополнение баланса
/telegram/servers      → Список серверов
/telegram/config/:id   → VLESS конфигурация
/telegram/subscription → Детали подписки
/telegram/promo        → Активация промокода
```

### Web Portal routes:
```
/web                   → Landing page
/web/login             → Вход через Telegram
/web/dashboard         → Личный кабинет
/web/billing           → Оплата
/web/billing/success   → Успешная оплата
/web/profile           → Профиль
/web/config/:id        → Конфигурация сервера
/web/transactions      → История платежей
/web/promo             → Промокоды
/web/terms             → Условия использования
/web/faq               → FAQ
```

---

## 🚀 Этапы внедрения

### Phase 1: Подготовка (День 1-2)
- [x] Создать MIGRATION_PLAN.md
- [ ] Создать новую структуру директорий
- [ ] Настроить Route Groups в Next.js
- [ ] Реализовать environment detection
- [ ] Создать middleware для redirects

### Phase 2: Миграция компонентов (День 3-5)
- [ ] Перенести UI компоненты из portal в shared/
- [ ] Создать telegram/ и web/ specific компоненты
- [ ] Объединить стили (globals.css)
- [ ] Портировать страницы portal → (web)/
- [ ] Переместить страницы miniapp → (telegram)/

### Phase 3: Унификация авторизации (День 6-7)
- [ ] Создать unified auth system
- [ ] Реализовать Telegram initData auth
- [ ] Добавить Telegram Login Widget для web
- [ ] Настроить session management
- [ ] Обновить middleware для auth

### Phase 4: API интеграция (День 8-9)
- [ ] Объединить API клиенты
- [ ] Унифицировать endpoints
- [ ] Добавить error handling
- [ ] Настроить interceptors

### Phase 5: Тестирование (День 10-11)
- [ ] Протестировать Telegram Mini App
- [ ] Протестировать Web Portal
- [ ] Проверить авторизацию в обеих средах
- [ ] Проверить redirects
- [ ] E2E тесты ключевых сценариев

### Phase 6: Deployment (День 12)
- [ ] Настроить Vercel deployment
- [ ] Настроить environment variables
- [ ] Обновить DNS записи
- [ ] Обновить Telegram bot webhook
- [ ] Обновить BotFather Mini App URL

---

## ⚙️ Конфигурация

### Environment Variables

```env
# API
NEXT_PUBLIC_API_URL=https://api.outlivion.space

# Telegram
NEXT_PUBLIC_TELEGRAM_BOT_NAME=outlivionbot
TELEGRAM_BOT_TOKEN=...
TELEGRAM_WEBHOOK_SECRET=...

# App URLs
NEXT_PUBLIC_APP_URL=https://app.outlivion.space
NEXT_PUBLIC_WEB_URL=https://app.outlivion.space/web
NEXT_PUBLIC_MINIAPP_URL=https://app.outlivion.space/telegram
```

### next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Rewrites для совместимости
  async rewrites() {
    return [
      {
        source: '/app',
        destination: '/telegram',
      },
    ];
  },
  
  // Redirects для старых URL
  async redirects() {
    return [
      {
        source: '/miniapp/:path*',
        destination: '/telegram/:path*',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
```

---

## 📊 Сравнение: До и После

### До миграции:

```
outlivion-portal/        → 3000 порт, отдельный деплой
outlivion-miniapp/       → 3002 порт, отдельный деплой

Проблемы:
- Дублирование кода
- Разная авторизация
- Сложная поддержка
- Два домена
```

### После миграции:

```
outlivion-app/
├── /web → Web Portal
└── /telegram → Mini App

Преимущества:
✅ Единая кодовая база
✅ Unified auth
✅ Общие компоненты
✅ Один домен
✅ Упрощенная поддержка
✅ Меньше затрат на хостинг
```

---

## 🔧 Важные моменты

### 1. Обратная совместимость
- Старые ссылки из Telegram должны работать
- Webhook endpoint остается на `/api/bot`
- API интеграция не меняется

### 2. SEO для Web Portal
- Server-side rendering для web routes
- Meta tags для каждой страницы
- sitemap.xml
- robots.txt

### 3. Performance
- Code splitting по route groups
- Lazy loading компонентов
- Оптимизация изображений
- CDN для статики

### 4. Monitoring
- Error tracking (Sentry)
- Analytics (GA4)
- Performance monitoring
- User behavior tracking

---

## ✅ Checklist перед запуском

### Development:
- [ ] Все компоненты перенесены
- [ ] Авторизация работает в обеих средах
- [ ] Навигация корректна
- [ ] Стили применяются правильно
- [ ] API запросы работают

### Testing:
- [ ] Telegram Mini App открывается
- [ ] Web Portal доступен
- [ ] Auto-redirect работает
- [ ] Auth flow в обеих средах
- [ ] Payments работают

### Production:
- [ ] Environment variables настроены
- [ ] Domain настроен
- [ ] SSL сертификаты
- [ ] Telegram bot webhook обновлен
- [ ] BotFather Mini App URL обновлен
- [ ] Monitoring настроен

---

**Начинаем с Phase 1!** 🚀

