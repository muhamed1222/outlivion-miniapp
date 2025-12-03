# 🔐 PHASE 3: Унификация авторизации

**Статус:** 🔜 В РАБОТЕ  
**Дата старта:** 3 декабря 2025, 18:15

---

## 🎯 Цель Phase 3

Создать **единую систему авторизации** для Telegram Mini App и Web Portal:
- Telegram `initData` как основной источник аутентификации
- JWT tokens для API requests
- Unified login/logout flows
- Secure token storage
- Session management

---

## 📋 Текущее состояние

### Что уже есть:

**Telegram Mini App:**
- ✅ `TelegramProvider` - инициализация WebApp
- ✅ `getTelegramUser()` - получение user data
- ✅ API client с token support
- ❌ Нет валидации `initData`
- ❌ Tokens не сохраняются properly

**Web Portal:**
- ✅ Login page с Telegram Login Widget UI
- ✅ `lib/auth.ts` из portal (axios-based)
- ❌ Не интегрирован с unified API
- ❌ Telegram Login Widget не настроен

**Общие проблемы:**
- ❌ Два разных auth механизма
- ❌ Нет единого `isAuthenticated()`
- ❌ Token storage inconsistent
- ❌ Middleware использует простую проверку cookies

---

## 🏗️ Архитектура Unified Auth

### Принципы:

1. **Single Source of Truth:** Telegram `initData`
2. **JWT Tokens:** Backend выдает access + refresh tokens
3. **Environment-Aware Storage:**
   - Telegram: `localStorage` (доступно в WebApp)
   - Web: `cookies` (HttpOnly, Secure для production)
4. **Unified API:** Один auth.ts для обеих сред

### Flow диаграмма:

```
┌──────────────────────────────────────────────────────┐
│  TELEGRAM MINI APP                                    │
├──────────────────────────────────────────────────────┤
│                                                       │
│  1. Open Mini App                                     │
│  2. Get initData from window.Telegram.WebApp          │
│  3. Send initData → Backend (/auth/telegram)         │
│  4. Backend validates initData                        │
│  5. Backend returns { accessToken, refreshToken }    │
│  6. Store tokens in localStorage                      │
│  7. Use accessToken for API requests                  │
│                                                       │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  WEB PORTAL                                           │
├──────────────────────────────────────────────────────┤
│                                                       │
│  1. Click "Login with Telegram" button               │
│  2. Telegram Login Widget opens                       │
│  3. User authorizes in Telegram                       │
│  4. Callback with user data + hash                    │
│  5. Send to Backend (/auth/telegram)                 │
│  6. Backend validates hash                            │
│  7. Backend returns { accessToken, refreshToken }    │
│  8. Store tokens in cookies (HttpOnly)               │
│  9. Use accessToken for API requests                  │
│                                                       │
└──────────────────────────────────────────────────────┘
```

---

## 📝 Задачи Phase 3

### 1. Создать Unified Auth Module

**Файл:** `src/lib/auth.ts`

**Функции:**
```typescript
// Authentication
loginWithTelegram(initData: string): Promise<AuthResponse>
loginWithTelegramWidget(data: TelegramAuthData): Promise<AuthResponse>

// Token Management
getAccessToken(): string | null
getRefreshToken(): string | null
setTokens(accessToken: string, refreshToken: string): void
clearTokens(): void
refreshAccessToken(): Promise<string>

// Session
isAuthenticated(): boolean
getCurrentUser(): User | null
logout(): void

// Validation
validateTelegramInitData(initData: string): boolean
```

**Environment-aware storage:**
```typescript
// Automatically uses localStorage or cookies based on environment
const storage = isTelegramEnvironment() ? localStorageAdapter : cookieAdapter
```

### 2. Интеграция с Backend API

**Endpoints:**
- `POST /auth/telegram` - Login via Telegram
  - Body: `{ initData }` для Mini App
  - Body: `{ id, first_name, last_name, username, photo_url, auth_date, hash }` для Web
  - Response: `{ accessToken, refreshToken, user }`

- `POST /auth/refresh` - Refresh access token
  - Body: `{ refreshToken }`
  - Response: `{ accessToken, refreshToken }`

- `POST /auth/logout` - Logout
  - Headers: `Authorization: Bearer ${accessToken}`
  - Response: `{ success: true }`

### 3. Обновить Login Pages

**Telegram (`/telegram/login`):**
- Проверка если уже авторизован → redirect to home
- Automatic login using `initData`
- Показать loading state
- Error handling

**Web (`/web/login`):**
- Telegram Login Widget integration
- Environment check (localhost vs production)
- Mock mode для development
- Redirect after successful login

### 4. Обновить Middleware

**Файл:** `src/middleware.ts`

**Изменения:**
- Использовать `isAuthenticated()` из unified auth
- Проверять оба storage (localStorage + cookies)
- Handle token refresh if expired
- Unified redirect logic

### 5. Token Refresh Logic

**Auto-refresh:**
- Перед каждым API request проверять expiration
- Если токен истек → вызвать `refreshAccessToken()`
- Если refresh failed → logout и redirect to login

**API interceptor:**
```typescript
api.interceptors.request.use(async (config) => {
  let token = getAccessToken();
  
  if (isTokenExpired(token)) {
    token = await refreshAccessToken();
  }
  
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

### 6. Secure Storage

**Telegram Mini App:**
- `localStorage.setItem('accessToken', token)`
- `localStorage.setItem('refreshToken', token)`
- `localStorage.setItem('user', JSON.stringify(user))`

**Web Portal:**
- `cookies.set('accessToken', token, { httpOnly: false, secure: true, sameSite: 'strict' })`
- `cookies.set('refreshToken', token, { httpOnly: true, secure: true, sameSite: 'strict' })`
- Session storage для user data

**Wrapper functions:**
```typescript
setAccessToken(token: string): void
setRefreshToken(token: string): void
getAccessToken(): string | null
getRefreshToken(): string | null
```

---

## 🔧 Implementation Steps

### Step 1: Создать Storage Adapters

**Файл:** `src/lib/storage.ts`

```typescript
interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const localStorageAdapter: StorageAdapter = { /* ... */ }
const cookieAdapter: StorageAdapter = { /* ... */ }

export const storage = isTelegramEnvironment() 
  ? localStorageAdapter 
  : cookieAdapter;
```

### Step 2: Создать Unified Auth Module

**Файл:** `src/lib/auth.ts` (rewrite)

- Объединить логику из portal auth.ts и miniapp auth
- Environment-aware token storage
- Unified login/logout
- Token refresh logic

### Step 3: Обновить API Client

**Файл:** `src/lib/api.ts`

- Добавить auth interceptor
- Auto-refresh tokens
- Handle 401 errors

### Step 4: Обновить Login Pages

- `/telegram/login` - Auto-login с initData
- `/web/login` - Telegram Login Widget

### Step 5: Обновить Middleware

- Использовать unified `isAuthenticated()`
- Проверять оба storage types

### Step 6: Testing

- Тестировать login flow в Telegram
- Тестировать login flow в Web
- Тестировать token refresh
- Тестировать logout

---

## 📊 Checklist

### Storage Layer
- [ ] Создать `src/lib/storage.ts`
- [ ] LocalStorage adapter
- [ ] Cookie adapter
- [ ] Environment detection в storage
- [ ] Helper functions (getItem, setItem, removeItem)

### Auth Module
- [ ] Обновить `src/lib/auth.ts`
- [ ] `loginWithTelegram(initData)` для Mini App
- [ ] `loginWithTelegramWidget(data)` для Web
- [ ] `isAuthenticated()` unified
- [ ] `getCurrentUser()` from storage
- [ ] `logout()` unified
- [ ] `setTokens()` environment-aware
- [ ] `getAccessToken()` environment-aware
- [ ] `refreshAccessToken()` logic

### API Integration
- [ ] Обновить `src/lib/api.ts`
- [ ] Auth interceptor (add token to requests)
- [ ] Response interceptor (handle 401)
- [ ] Auto-refresh token logic
- [ ] Error handling

### Login Pages
- [ ] Создать `/telegram/login/page.tsx` (если нужна)
- [ ] Обновить `/web/login/page.tsx`
- [ ] Telegram Login Widget setup
- [ ] Environment detection
- [ ] Mock mode для localhost

### Middleware
- [ ] Обновить `src/middleware.ts`
- [ ] Использовать unified `isAuthenticated()`
- [ ] Check both storage types
- [ ] Unified redirect logic

### Testing
- [ ] Login в Telegram Mini App
- [ ] Login в Web Portal
- [ ] Token refresh works
- [ ] Logout works в обеих средах
- [ ] Protected routes работают
- [ ] Auto-redirect работает

---

## 🎯 Expected Outcomes

### После Phase 3:

1. ✅ **Единая система авторизации**
   - Работает в Telegram и Web
   - Environment-aware storage
   - Automatic token refresh

2. ✅ **Seamless Login Experience**
   - Telegram: Auto-login с initData
   - Web: Telegram Login Widget
   - Both: Redirect to dashboard after login

3. ✅ **Secure Token Management**
   - Access tokens (short-lived)
   - Refresh tokens (long-lived)
   - HttpOnly cookies для web
   - localStorage для telegram

4. ✅ **Production-Ready Auth**
   - Proper error handling
   - Token expiration handling
   - Logout clears everything
   - Middleware protection working

---

## 💡 Technical Decisions

### 1. Why Telegram initData?

**Telegram Mini App:**
- `initData` содержит подписанные данные пользователя
- Backend может валидировать подпись
- Не требует OAuth flow
- Автоматически доступно в WebApp

**Web Portal:**
- Telegram Login Widget генерирует аналогичные данные
- Тот же механизм валидации на backend
- Unified authentication logic

### 2. Why Different Storage?

**localStorage (Telegram):**
- ✅ Доступно в Telegram WebApp
- ✅ Простой API
- ✅ Достаточно для Mini App
- ❌ Не HttpOnly (but okay для Mini App)

**cookies (Web):**
- ✅ HttpOnly для refresh token (security)
- ✅ Secure flag для production
- ✅ SameSite protection
- ✅ Automatic sending с requests

### 3. Token Strategy

**Access Token:**
- Short-lived (1 hour)
- Stored in both environments
- Used for API requests
- Refreshed automatically

**Refresh Token:**
- Long-lived (7 days)
- HttpOnly cookie (web) or localStorage (telegram)
- Used to get new access tokens
- Rotated on each refresh

---

## 🚀 Getting Started

### Commands:

```bash
# Создать storage adapter
"Создай src/lib/storage.ts с adapters"

# Обновить auth.ts
"Обнови src/lib/auth.ts для unified auth"

# Обновить API client
"Добавь auth interceptor в src/lib/api.ts"

# Обновить login pages
"Обнови login pages для обеих сред"
```

---

## 📚 References

### Telegram WebApp API:
- `window.Telegram.WebApp.initData` - Signed user data
- `window.Telegram.WebApp.initDataUnsafe` - Parsed data

### Backend Integration:
- Outlivion API: `POST /auth/telegram`
- JWT validation on server side
- Token refresh endpoint

---

**Время оценка:** ~2-3 часа  
**Сложность:** Medium-High  
**Приоритет:** High (required для production)

---

*Phase 3 Plan - Outlivion VPN Platform*  
*Created: 3 декабря 2025, 18:15*

