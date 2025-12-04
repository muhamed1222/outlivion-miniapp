# 🔧 Troubleshooting Guide - Outlivion Mini App

Руководство по решению распространенных проблем.

---

## 🔴 Ошибка 500 при Bot Login

### Проблема
```
Failed to load resource: the server responded with a status of 500
[Bot Login] Failed to create token: AxiosError
```

### Возможные причины

#### 1. Database Connection Issues

**Проверка:**
```bash
# В outlivion-api проекте
curl http://localhost:3001/health

# Ожидаемый ответ:
{
  "status": "ok",
  "database": "connected"
}
```

**Решение:**
- Проверьте `DATABASE_URL` в `.env`
- Убедитесь что PostgreSQL запущен
- Проверьте таблицу `login_sessions` существует:
  ```bash
  npm run db:migrate
  ```

#### 2. Missing Environment Variables

**Проверка:**
```bash
# В outlivion-api
grep TELEGRAM_BOT_USERNAME .env
```

**Решение:**
Добавьте в `.env`:
```env
TELEGRAM_BOT_USERNAME=outlivionbot
```

#### 3. Rate Limiting

**Проверка:**
Посмотрите логи API:
```bash
# outlivion-api logs
npm run dev

# Ищите:
"Too many requests from this IP"
```

**Решение:**
- Подождите 1 минуту
- Или временно отключите rate limiting в dev

#### 4. Database Migration Not Applied

**Проверка:**
```sql
-- В PostgreSQL
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'login_sessions'
);
```

**Решение:**
```bash
cd outlivion-api
npm run db:migrate
```

---

## 🔴 Авторизация не работает в Telegram Mini App

### Проблема
Auto-login падает или возвращает ошибку.

### Диагностика

**1. Проверить initData:**
```javascript
// В консоли браузера (Telegram WebApp)
window.Telegram.WebApp.initData
```

Если пустая строка - проблема с Telegram WebApp.

**2. Проверить API URL:**
```javascript
// В консоли
console.log(process.env.NEXT_PUBLIC_API_URL)
```

**3. Проверить токены:**
```javascript
// В консоли
localStorage.getItem('accessToken')
localStorage.getItem('refreshToken')
```

### Решения

#### Scenario 1: initData пустой

**Причина:** Приложение запущено вне Telegram

**Решение:**
- Откройте через Telegram бота: `/start`
- Или в dev режиме используйте mock данные

#### Scenario 2: API недоступен

**Проверка:**
```bash
curl https://api.outlivion.space/health
```

**Решение:**
- Проверьте CORS в API
- Убедитесь API запущен
- Проверьте `NEXT_PUBLIC_API_URL` в `.env`

#### Scenario 3: Токены не сохраняются

**Причина:** localStorage заблокирован

**Решение:**
```javascript
// Очистить localStorage
localStorage.clear()

// Перезайти в приложение
```

---

## 🟡 Auto-refresh токенов не работает

### Проблема
Пользователь логаутится через 1 час (access token expired).

### Диагностика

**1. Проверить refresh token:**
```javascript
localStorage.getItem('refreshToken')
```

**2. Проверить backend endpoint:**
```bash
curl -X POST https://api.outlivion.space/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "YOUR_REFRESH_TOKEN"}'
```

### Решение

#### Scenario 1: Refresh token отсутствует

**Причина:** Не был сохранен при login

**Решение:**
- Проверьте что API возвращает `refreshToken`
- Проверьте `tokenStorage.setRefreshToken()` вызывается

#### Scenario 2: Refresh token expired

**Причина:** Истек срок (7 дней по умолчанию)

**Решение:**
- Пользователь должен перелогиниться
- Это нормальное поведение

#### Scenario 3: API возвращает 401 на refresh

**Причина:** Refresh token невалидный

**Решение:**
- Очистить токены и перелогиниться
- Проверить `JWT_SECRET` на backend

---

## 🟡 API запросы падают с CORS errors

### Проблема
```
Access to XMLHttpRequest blocked by CORS policy
```

### Решение

**Backend (outlivion-api):**

Проверьте `src/index.ts`:
```typescript
const allowedOrigins = [
  'http://localhost:3002',
  'https://app.outlivion.space',
  // ... other origins
];
```

Добавьте ваш origin если отсутствует.

**Frontend:**

Проверьте `.env`:
```env
NEXT_PUBLIC_API_URL=https://api.outlivion.space
```

---

## 🟢 Middleware блокирует Telegram routes

### Проблема
Редирект на login при открытии `/telegram/*`

### Решение

Проверьте `middleware.ts`:
```typescript
// Должна быть проверка:
if (isTelegramRoute(pathname)) {
  return NextResponse.next();
}
```

Если отсутствует - обновите middleware согласно последним изменениям.

---

## 🔍 Диагностические команды

### Frontend (Mini App)

```bash
# Проверить health
curl http://localhost:3002/api/health

# Проверить environment
node -e "console.log(process.env.NEXT_PUBLIC_API_URL)"

# Проверить build errors
npm run build

# Проверить linter
npm run lint

# Запустить тесты
npm test
```

### Backend (API)

```bash
# Проверить health
curl http://localhost:3001/health

# Проверить database
npm run db:studio

# Проверить миграции
npm run db:migrate

# Проверить логи
tail -f logs/*.log

# Проверить environment
node -e "console.log(process.env.DATABASE_URL)"
```

### Database

```bash
# Подключиться к БД
psql $DATABASE_URL

# Проверить таблицы
\dt

# Проверить login_sessions
SELECT * FROM login_sessions ORDER BY created_at DESC LIMIT 5;

# Проверить users
SELECT COUNT(*) FROM users;
```

---

## 🛠️ Полный Reset (когда ничего не помогает)

### Frontend

```bash
cd outlivion-miniapp

# Очистить все
rm -rf .next node_modules
npm cache clean --force

# Переустановить
npm install

# Пересобрать
npm run build

# Запустить
npm run dev
```

### Backend

```bash
cd outlivion-api

# Очистить все
rm -rf dist node_modules
npm cache clean --force

# Переустановить
npm install

# Сбросить БД (ОСТОРОЖНО! Удалит все данные)
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Применить миграции
npm run db:migrate

# Заполнить тестовыми данными
npm run db:seed

# Запустить
npm run dev
```

### Browser

```javascript
// В консоли браузера
localStorage.clear()
sessionStorage.clear()

// Очистить cookies
document.cookie.split(";").forEach(c => {
  document.cookie = c.trim().split("=")[0] + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC";
});

// Hard reload
location.reload(true)
```

---

## 📞 Получить помощь

Если проблема не решилась:

1. **Соберите информацию:**
   - Frontend logs (Browser Console)
   - Backend logs (`npm run dev` output)
   - Database logs (`psql` errors)
   - Environment variables (скройте secrets!)

2. **Создайте issue:**
   - GitHub: https://github.com/outlivion/outlivion-miniapp/issues
   - Укажите версию: v2.0.0
   - Приложите логи

3. **Контакты:**
   - Email: support@outlivion.space
   - Telegram: @outlivion_support

---

**Last Updated:** December 2025  
**Version:** 2.0.0

