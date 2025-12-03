# 🔌 PHASE 4: Интеграция с Backend API

**Статус:** 🔜 В РАБОТЕ  
**Дата старта:** 3 декабря 2025, 18:45

---

## 🎯 Цель Phase 4

Обеспечить **полную интеграцию** frontend с backend API:
- Поддержка Telegram `initData` в backend
- Тестирование auth flow
- Проверка всех API endpoints
- Error handling
- Real data integration

---

## 📋 Текущее состояние

### Backend API (Outlivion API):

✅ **Auth Endpoints:**
- `POST /auth/telegram` - Login via Telegram (Widget data)
- `POST /auth/refresh` - Refresh access token

✅ **User Endpoints:**
- `GET /user` - Get current user
- `GET /user/subscription` - Get subscription
- `GET /user/payments` - Get payment history
- `GET /user/servers` - Get server configs

✅ **Server Endpoints:**
- `GET /servers` - List available servers
- `GET /servers/:id/config` - Get/create server config
- `DELETE /servers/:id/config` - Delete config

✅ **Payment Endpoints:**
- `POST /billing/create` - Create payment
- `POST /billing/webhook` - Mercuryo webhook

✅ **Promo Endpoints:**
- `POST /promo/apply` - Apply promo code

### Frontend API (Unified App):

✅ **API Client:**
- `authApi.loginWithTelegram()` 
- `authApi.refreshToken()`
- `userApi.getUser()`
- `userApi.getSubscription()`
- `userApi.getPayments()`
- `userApi.getServers()`
- `serverApi.getServers()`
- `serverApi.getServerConfig()`
- `billingApi.createPayment()`
- `promoApi.applyPromoCode()`

### Проблемы:

❌ **Backend не поддерживает `initData`:**
- Текущий `/auth/telegram` принимает только Widget data
- Нужно добавить поддержку Telegram Mini App `initData`

❌ **Missing Endpoints:**
- `billingApi.getTariffs()` - нет в backend

❌ **Error Handling:**
- Нужно улучшить user-facing messages

---

## 🏗️ План реализации

### Step 1: Обновить Backend Auth ✅

**Файл:** `outlivion-api/src/routes/auth.ts`

**Задача:** Добавить поддержку `initData` от Telegram Mini App

**Changes:**
```typescript
// Добавить поддержку двух форматов:
// 1. Widget data: { id, first_name, ..., hash }
// 2. initData: string с URL-encoded параметрами

POST /auth/telegram
Body options:
  Option 1 (Widget): { id, first_name, last_name, username, photo_url, auth_date, hash, referralId? }
  Option 2 (Mini App): { initData: string, referralId? }
```

**Implementation:**
1. Detect format (initData string vs Widget object)
2. Parse initData if it's a string
3. Validate signature for both formats
4. Extract user data
5. Create/update user
6. Return tokens

### Step 2: Создать Endpoint для Tariffs

**Файл:** `outlivion-api/src/routes/billing.ts`

**Endpoint:** `GET /billing/tariffs`

**Response:**
```json
{
  "tariffs": [
    {
      "id": "basic",
      "name": "Базовый",
      "price": 100,
      "duration": 30,
      "devices": 3,
      "features": ["Безлимитный трафик", "Высокая скорость"]
    }
  ]
}
```

### Step 3: Обновить Frontend API

**Файл:** `outlivion-miniapp/src/lib/api.ts`

**Changes:**
1. Update `authApi.loginWithTelegram()` to handle `initData`
2. Add `billingApi.getTariffs()`
3. Improve error messages

### Step 4: Тестирование Auth Flow

**Telegram Mini App:**
1. Open Mini App
2. Auto-login с `initData`
3. Verify tokens stored
4. Check user data

**Web Portal:**
1. Open `/web/login`
2. Click Telegram Login
3. Callback processing
4. Verify tokens stored

### Step 5: Тестирование API Endpoints

**User Endpoints:**
- GET `/user` - User data
- GET `/user/subscription` - Subscription
- GET `/user/payments` - Payments
- GET `/user/servers` - Server configs

**Server Endpoints:**
- GET `/servers` - List servers
- GET `/servers/:id/config` - Get config

**Billing:**
- GET `/billing/tariffs` - Get tariffs
- POST `/billing/create` - Create payment

**Promo:**
- POST `/promo/apply` - Apply code

### Step 6: Error Handling

**Improve:**
- Network errors → user-friendly messages
- 401 errors → clear "Please login"
- 500 errors → "Something went wrong"
- Validation errors → specific field messages

### Step 7: Environment Variables

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_TELEGRAM_BOT_NAME=outlivionbot
```

**Backend (.env):**
```env
DATABASE_URL=postgresql://...
TELEGRAM_BOT_TOKEN=...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
```

---

## 📝 Detailed Tasks

### Backend Changes:

#### 1. Support initData in `/auth/telegram`

```typescript
// outlivion-api/src/routes/auth.ts

router.post('/telegram', asyncHandler(async (req, res) => {
  const { initData, referralId, ...widgetData } = req.body;
  
  let telegramData;
  
  if (initData) {
    // Mini App: Parse initData string
    telegramData = parseTelegramInitData(initData);
    
    // Validate initData signature
    if (!verifyInitDataSignature(initData, process.env.TELEGRAM_BOT_TOKEN)) {
      return res.status(401).json({ error: 'Invalid initData' });
    }
  } else {
    // Widget: Use provided data
    telegramData = widgetData;
    
    // Validate Widget signature
    if (!verifyTelegramAuth(telegramData, process.env.TELEGRAM_BOT_TOKEN)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
  }
  
  // Continue with user creation/login...
}));
```

#### 2. Create `/billing/tariffs` endpoint

```typescript
// outlivion-api/src/routes/billing.ts

router.get('/tariffs', asyncHandler(async (req, res) => {
  const tariffs = [
    {
      id: 'basic',
      name: 'Базовый',
      price: 100,
      duration: 30, // days
      devices: 3,
      features: [
        'Безлимитный трафик',
        'Высокая скорость',
        'До 3 устройств',
      ],
    },
  ];
  
  res.json({ tariffs });
}));
```

### Frontend Changes:

#### 1. Update auth API

```typescript
// outlivion-miniapp/src/lib/api.ts

export const authApi = {
  async loginWithTelegram(data: {
    // Option 1: initData (Mini App)
    initData?: string;
    // Option 2: Widget data
    id?: string;
    first_name?: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    auth_date?: string;
    hash?: string;
    referralId?: string;
  }): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/telegram', data);
    return response;
  },
};
```

#### 2. Add tariffs endpoint

```typescript
// outlivion-miniapp/src/lib/api.ts

export const billingApi = {
  async getTariffs(): Promise<TariffResponse> {
    return apiClient.get<TariffResponse>('/billing/tariffs');
  },
  
  async createPayment(params: {
    plan: string;
    devices?: number;
    promoCode?: string;
  }): Promise<CreatePaymentResponse> {
    return apiClient.post<CreatePaymentResponse>('/billing/create', params);
  },
};
```

---

## 🧪 Testing Plan

### 1. Auth Testing

**Telegram Mini App:**
```
1. Open http://localhost:3002/telegram
2. Should auto-redirect to /telegram/login
3. Auto-login with initData
4. Verify redirect to /telegram
5. Check localStorage has tokens
6. API calls should work with token
```

**Web Portal:**
```
1. Open http://localhost:3002/web/login
2. Click "Login with Telegram"
3. Callback processes
4. Verify redirect to /web/dashboard
5. Check cookies have tokens
6. API calls should work with token
```

### 2. User Data Testing

```
1. GET /user
   → Should return user data
   
2. GET /user/subscription
   → Should return subscription or null
   
3. GET /user/payments
   → Should return payment history
   
4. GET /user/servers
   → Should return server configs
```

### 3. Server Testing

```
1. GET /servers
   → Should return list of available servers
   
2. GET /servers/:id/config
   → Should create/return config for server
```

### 4. Billing Testing

```
1. GET /billing/tariffs
   → Should return available tariffs
   
2. POST /billing/create
   → Should create payment link
```

### 5. Promo Testing

```
1. POST /promo/apply
   → Should apply promo code
   → Should add bonus to balance
```

---

## 📊 Success Criteria

### Backend:
- ✅ `initData` validation works
- ✅ All endpoints return correct data
- ✅ JWT tokens work
- ✅ Error handling proper

### Frontend:
- ✅ Telegram auto-login works
- ✅ Web login works
- ✅ All pages load data
- ✅ Error messages clear

### Integration:
- ✅ Tokens persist correctly
- ✅ API calls authenticated
- ✅ Refresh token works
- ✅ Logout clears everything

---

## 🔧 Implementation Order

1. ✅ Analyze backend API (Done)
2. ⏳ Add `initData` support to backend
3. ⏳ Create `/billing/tariffs` endpoint
4. ⏳ Update frontend API client
5. ⏳ Test auth flow (Telegram)
6. ⏳ Test auth flow (Web)
7. ⏳ Test all API endpoints
8. ⏳ Improve error handling
9. ⏳ Final integration test

---

## 💡 Notes

### Telegram initData Format:
```
query_id=AAHdF6IQAAAAAN0XohDhrOrc&
user={"id":279058397,"first_name":"John"}&
auth_date=1662771648&
hash=c501b71e775f74ce10e377dea85a7ea24ecd640b223ea86dfe453e0eaed2e2b2
```

### JWT Token Expiration:
- Access Token: 1 hour
- Refresh Token: 7 days

### Environment Detection:
```typescript
const isTelegram = window.Telegram?.WebApp?.initData !== undefined;
```

---

**Время оценка:** ~2 hours  
**Сложность:** Medium  
**Приоритет:** Critical (required для production)

---

*Phase 4 Plan - Outlivion VPN Platform*  
*Created: 3 декабря 2025, 18:45*

