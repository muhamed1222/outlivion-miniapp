# 🧪 PHASE 5: Тестирование интеграции

**Статус:** 🔜 В РАБОТЕ  
**Дата старта:** 3 декабря 2025, 19:10

---

## 🎯 Цель Phase 5

**Полное тестирование интеграции** frontend и backend:
- ✅ Запустить backend API
- ✅ Протестировать все endpoints
- ✅ Проверить auth flow
- ✅ Integration testing
- ✅ Error handling verification

---

## 📋 Testing Plan

### 1. Backend API Startup

**Steps:**
```bash
# 1. Check if backend running
lsof -i :3001

# 2. Start backend if not running
cd outlivion-api
npm run dev

# 3. Verify health
curl http://localhost:3001/health
```

**Expected:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-03T...",
  "uptime": ...
}
```

### 2. Auth Endpoints Testing

#### Test 1: POST /auth/telegram (initData)

**Request:**
```bash
curl -X POST http://localhost:3001/auth/telegram \
  -H "Content-Type: application/json" \
  -d '{
    "initData": "query_id=AAHdF6IQAAAAAN0XohDhrOrc&user={\"id\":279058397,\"first_name\":\"Test\"}&auth_date=1234567890&hash=mock_hash_for_development"
  }'
```

**Expected Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": 3600,
  "token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "telegramId": "279058397",
    "firstName": "Test",
    "isNewUser": true
  }
}
```

#### Test 2: POST /auth/telegram (Widget)

**Request:**
```bash
curl -X POST http://localhost:3001/auth/telegram \
  -H "Content-Type: application/json" \
  -d '{
    "id": "279058397",
    "first_name": "Test",
    "auth_date": "1234567890",
    "hash": "mock_hash_for_development"
  }'
```

**Expected:** Same as Test 1

#### Test 3: POST /auth/refresh

**Request:**
```bash
curl -X POST http://localhost:3001/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "REFRESH_TOKEN_FROM_TEST1",
    "telegramId": "279058397"
  }'
```

**Expected:**
```json
{
  "accessToken": "new_token...",
  "refreshToken": "new_refresh...",
  "expiresIn": 3600,
  "token": "new_token..."
}
```

### 3. User Endpoints Testing

#### Test 4: GET /user

**Request:**
```bash
curl http://localhost:3001/user \
  -H "Authorization: Bearer ACCESS_TOKEN_FROM_TEST1"
```

**Expected:**
```json
{
  "id": "uuid",
  "telegramId": "279058397",
  "firstName": "Test",
  "balance": 0,
  "createdAt": "2025-12-03T..."
}
```

#### Test 5: GET /user/subscription

**Request:**
```bash
curl http://localhost:3001/user/subscription \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

**Expected:**
```json
{
  "id": "uuid",
  "status": "active",
  "expiresAt": "2025-12-30T...",
  "daysRemaining": 27
}
```
or `null` if no subscription

### 4. Billing Endpoints Testing

#### Test 6: GET /billing/tariffs

**Request:**
```bash
curl http://localhost:3001/billing/tariffs
```

**Expected:**
```json
{
  "tariffs": [
    {
      "id": "30days",
      "name": "Базовый",
      "duration": 30,
      "price": 100,
      "pricePerMonth": 100,
      "discount": 0,
      "features": ["Безлимитный трафик", "..."],
      "popular": true
    }
  ],
  "currency": "RUB",
  "defaultDevices": 1,
  "maxDevices": 10
}
```

#### Test 7: POST /billing/create

**Request:**
```bash
curl -X POST http://localhost:3001/billing/create \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "30days",
    "devices": 1
  }'
```

**Expected:**
```json
{
  "paymentUrl": "https://exchange.mercuryo.io/...",
  "paymentId": "uuid",
  "amount": 100,
  "currency": "RUB"
}
```

### 5. Server Endpoints Testing

#### Test 8: GET /servers

**Request:**
```bash
curl http://localhost:3001/servers \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

**Expected:**
```json
{
  "servers": [
    {
      "id": "uuid",
      "name": "Netherlands",
      "location": "Amsterdam",
      "flag": "🇳🇱",
      "status": "active"
    }
  ]
}
```

### 6. Promo Endpoints Testing

#### Test 9: POST /promo/apply

**Request:**
```bash
curl -X POST http://localhost:3001/promo/apply \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "WELCOME50"
  }'
```

**Expected:**
```json
{
  "valid": true,
  "bonus": 50,
  "message": "Промокод применён! +50₽ на баланс"
}
```

### 7. Integration Testing

#### Frontend → Backend Flow

**Test 10: Telegram Auto-login**
1. Open `http://localhost:3002/telegram/login`
2. Should attempt auto-login with initData
3. Check browser console for:
   - `initData` being sent
   - Response with tokens
   - Redirect to `/telegram`

**Test 11: Web Login**
1. Open `http://localhost:3002/web/login`
2. (Mock) Trigger Telegram callback
3. Verify token storage in cookies
4. Redirect to `/web/dashboard`

**Test 12: Protected Routes**
1. Clear tokens
2. Try to access `/telegram/billing`
3. Should redirect to `/telegram/login`

**Test 13: API Calls**
1. Login successfully
2. Navigate to `/web/dashboard`
3. Check Network tab:
   - `GET /user` with Authorization header
   - `GET /user/subscription` with Authorization
4. Verify data displays correctly

---

## ✅ Success Criteria

### Backend:
- ✅ All endpoints return 200/201
- ✅ Auth validates correctly
- ✅ Tokens work for protected routes
- ✅ Error responses are proper

### Frontend:
- ✅ Auto-login works (Telegram)
- ✅ Login Widget works (Web)
- ✅ Tokens stored correctly
- ✅ API calls authenticated
- ✅ Data displays correctly

### Integration:
- ✅ No CORS errors
- ✅ Token refresh works
- ✅ Logout clears everything
- ✅ Error handling proper

---

## 🔧 Environment Setup

### Required:

**Backend (.env):**
```env
DATABASE_URL=postgresql://localhost:5432/outlivion
TELEGRAM_BOT_TOKEN=your_bot_token
JWT_SECRET=your_secret
JWT_REFRESH_SECRET=your_refresh_secret
ALLOW_MOCK_AUTH=true  # For testing
NODE_ENV=development
PORT=3001
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_TELEGRAM_BOT_NAME=outlivionbot
TELEGRAM_BOT_TOKEN=your_bot_token
```

### Databases:
```bash
# Start PostgreSQL
docker run -d \
  --name outlivion-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=outlivion \
  -p 5432:5432 \
  postgres:15

# Run migrations
cd outlivion-api
npm run db:push
```

---

## 📊 Testing Checklist

### Setup:
- [ ] PostgreSQL running
- [ ] Backend API running (port 3001)
- [ ] Frontend running (port 3002)
- [ ] Environment variables set

### Auth Tests:
- [ ] POST /auth/telegram (initData)
- [ ] POST /auth/telegram (Widget)
- [ ] POST /auth/refresh
- [ ] Invalid signature rejected
- [ ] Expired auth rejected

### User Tests:
- [ ] GET /user
- [ ] GET /user/subscription
- [ ] GET /user/payments
- [ ] GET /user/servers

### Billing Tests:
- [ ] GET /billing/tariffs
- [ ] POST /billing/create

### Server Tests:
- [ ] GET /servers
- [ ] GET /servers/:id/config

### Promo Tests:
- [ ] POST /promo/apply (valid)
- [ ] POST /promo/apply (invalid)

### Integration Tests:
- [ ] Telegram auto-login flow
- [ ] Web login flow
- [ ] Token refresh
- [ ] Protected route access
- [ ] API calls with auth
- [ ] Logout flow

---

## 🚀 Getting Started

```bash
# Terminal 1: Backend
cd outlivion-api
npm run dev

# Terminal 2: Frontend
cd outlivion-miniapp
npm run dev

# Terminal 3: Testing
# Run curl commands or use Postman
```

---

**Время оценка:** ~1 hour  
**Сложность:** Medium  
**Приоритет:** High

---

*Phase 5 Plan - Outlivion VPN Platform*  
*Created: 3 декабря 2025, 19:10*

