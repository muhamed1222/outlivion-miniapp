# Outlivion MiniApp - Deployment Guide

Руководство по развертыванию Telegram MiniApp в production.

## 📋 Pre-Deployment Checklist

- [ ] Backend API готов и поддерживает `/miniapp/*` endpoints
- [ ] Telegram Bot создан и настроен
- [ ] Environment variables настроены
- [ ] HTTPS сертификат готов (обязательно для Telegram)
- [ ] Домен настроен
- [ ] База данных готова

## 🔐 Environment Variables

### Production Environment

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_TELEGRAM_BOT_NAME=your_bot_name
NODE_ENV=production
```

### Security Considerations

- ❌ НЕ храните Bot Token в MiniApp
- ✅ Bot Token должен быть только на backend
- ✅ Используйте HTTPS для всех запросов
- ✅ Настройте CORS на backend

## 🚀 Deployment Options

### Option 1: Vercel (Рекомендуется)

#### Step 1: Подготовка

```bash
# Установите Vercel CLI
npm i -g vercel

# Войдите в аккаунт
vercel login
```

#### Step 2: Настройка проекта

```bash
cd apps/miniapp
vercel
```

#### Step 3: Настройка Environment Variables

В Vercel Dashboard:
1. Settings → Environment Variables
2. Добавьте:
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_TELEGRAM_BOT_NAME`

#### Step 4: Deploy

```bash
vercel --prod
```

#### Step 5: Custom Domain (Optional)

В Vercel Dashboard:
1. Settings → Domains
2. Добавьте ваш домен
3. Настройте DNS записи

#### Vercel Configuration

`vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["fra1"]
}
```

### Option 2: Docker + VPS

#### Step 1: Build Docker Image

```bash
cd apps/miniapp
docker build -t outlivion-miniapp:latest .
```

#### Step 2: Push to Registry (Optional)

```bash
# Docker Hub
docker tag outlivion-miniapp:latest username/outlivion-miniapp:latest
docker push username/outlivion-miniapp:latest

# или GitHub Container Registry
docker tag outlivion-miniapp:latest ghcr.io/username/outlivion-miniapp:latest
docker push ghcr.io/username/outlivion-miniapp:latest
```

#### Step 3: Deploy on VPS

```bash
# На сервере
docker pull username/outlivion-miniapp:latest

docker run -d \
  --name outlivion-miniapp \
  --restart unless-stopped \
  -p 3002:3002 \
  -e NEXT_PUBLIC_API_URL=https://api.yourdomain.com \
  -e NODE_ENV=production \
  username/outlivion-miniapp:latest
```

#### Step 4: Nginx Reverse Proxy

`/etc/nginx/sites-available/miniapp`:
```nginx
server {
    listen 80;
    server_name miniapp.yourdomain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name miniapp.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/miniapp.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/miniapp.yourdomain.com/privkey.pem;
    
    # Security Headers
    add_header X-Frame-Options "ALLOW-FROM https://web.telegram.org" always;
    add_header Content-Security-Policy "frame-ancestors 'self' https://web.telegram.org https://telegram.org" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Proxy to Next.js
    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Cache static files
    location /_next/static {
        proxy_cache STATIC;
        proxy_pass http://localhost:3002;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

Включите конфигурацию:
```bash
sudo ln -s /etc/nginx/sites-available/miniapp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Option 3: Docker Compose

`docker-compose.prod.yml`:
```yaml
version: '3.8'

services:
  miniapp:
    build:
      context: ./apps/miniapp
      dockerfile: Dockerfile
    container_name: outlivion-miniapp
    restart: unless-stopped
    ports:
      - "3002:3002"
    environment:
      - NEXT_PUBLIC_API_URL=https://api.yourdomain.com
      - NODE_ENV=production
    networks:
      - outlivion-network
    depends_on:
      - backend

  backend:
    # ... backend configuration

networks:
  outlivion-network:
    driver: bridge
```

Deploy:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🔧 SSL/TLS Setup

### Let's Encrypt with Certbot

```bash
# Установка certbot
sudo apt install certbot python3-certbot-nginx

# Получение сертификата
sudo certbot --nginx -d miniapp.yourdomain.com

# Автообновление
sudo certbot renew --dry-run
```

## 🤖 Telegram Bot Configuration

### Step 1: Set Web App URL

```bash
# В @BotFather
/setmenubutton
[выберите вашего бота]

# Введите:
Button text: Открыть VPN 🚀
Web App URL: https://miniapp.yourdomain.com
```

### Step 2: Set Domain

```bash
/setdomain
[выберите вашего бота]
Domain: miniapp.yourdomain.com
```

### Step 3: Configure Commands (Optional)

```bash
/setcommands
[выберите вашего бота]

# Команды:
start - Запустить VPN
help - Помощь
support - Поддержка
```

### Step 4: Bot Description

```bash
/setdescription
[выберите вашего бота]

# Описание:
Быстрый и безопасный VPN сервис. 
Подключайтесь за 1 минуту! 🚀
```

## 📊 Monitoring

### Health Check Endpoint

Создайте endpoint для проверки здоровья:

`src/app/api/health/route.ts`:
```typescript
export async function GET() {
  return Response.json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
}
```

### Uptime Monitoring

Используйте сервисы:
- UptimeRobot
- Pingdom
- StatusCake

Настройте мониторинг на:
- `https://miniapp.yourdomain.com/api/health`
- Интервал: 5 минут

### Logs

#### Vercel

```bash
vercel logs
vercel logs --follow
```

#### Docker

```bash
docker logs outlivion-miniapp
docker logs -f outlivion-miniapp --tail 100
```

## 🔄 CI/CD

### GitHub Actions

`.github/workflows/deploy-miniapp.yml`:
```yaml
name: Deploy MiniApp

on:
  push:
    branches: [main]
    paths:
      - 'apps/miniapp/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        working-directory: ./apps/miniapp
        run: npm ci
        
      - name: Build
        working-directory: ./apps/miniapp
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.API_URL }}
          
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./apps/miniapp
```

## 🔒 Security Best Practices

### 1. Content Security Policy

В `next.config.js`:
```javascript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: "frame-ancestors 'self' https://web.telegram.org https://telegram.org"
        }
      ]
    }
  ];
}
```

### 2. Rate Limiting

Настройте rate limiting на backend для `/miniapp/*` endpoints.

### 3. Input Validation

Всегда валидируйте пользовательский ввод на backend.

### 4. CORS Configuration

На backend:
```javascript
app.use(cors({
  origin: [
    'https://miniapp.yourdomain.com',
    'https://web.telegram.org'
  ],
  credentials: true
}));
```

## 🧪 Post-Deployment Testing

### Checklist

- [ ] Приложение открывается в Telegram
- [ ] Авторизация работает
- [ ] API запросы успешны
- [ ] Все страницы загружаются
- [ ] Навигация работает
- [ ] Haptic feedback срабатывает
- [ ] QR коды генерируются
- [ ] Платежи работают
- [ ] Логи чистые (без ошибок)

### Test in Production

```bash
# Откройте бота в Telegram
t.me/your_bot_name

# Нажмите на кнопку меню "Открыть VPN"
# Проверьте все функции
```

## 📈 Performance Optimization

### 1. CDN Configuration

Используйте CDN для статических файлов:
- Vercel автоматически использует Edge Network
- Для VPS настройте Cloudflare

### 2. Image Optimization

Next.js автоматически оптимизирует изображения:
```typescript
import Image from 'next/image';

<Image 
  src="/logo.png" 
  width={200} 
  height={200}
  alt="Logo"
/>
```

### 3. Code Splitting

Используйте dynamic imports:
```typescript
import dynamic from 'next/dynamic';

const QRCode = dynamic(() => import('qrcode.react'), {
  ssr: false,
  loading: () => <Loading />
});
```

## 🔄 Updates & Rollback

### Vercel

```bash
# Deploy новой версии
vercel --prod

# Rollback к предыдущей
vercel rollback
```

### Docker

```bash
# Deploy новой версии
docker pull username/outlivion-miniapp:latest
docker stop outlivion-miniapp
docker rm outlivion-miniapp
docker run -d --name outlivion-miniapp ...

# Rollback
docker run -d --name outlivion-miniapp username/outlivion-miniapp:previous-tag
```

## 🆘 Troubleshooting

### Issue: "Cannot connect to API"

**Check:**
1. Backend запущен и доступен
2. CORS настроен правильно
3. HTTPS работает
4. Firewall правила корректны

### Issue: "Telegram не открывает MiniApp"

**Check:**
1. HTTPS обязателен
2. CSP headers настроены
3. Web App URL правильный в @BotFather
4. Домен соответствует

### Issue: "401 Unauthorized"

**Check:**
1. initData корректно отправляется
2. Backend проверяет подпись правильно
3. Bot Token правильный на backend

## 📞 Support

При проблемах с deployment:
1. Проверьте логи
2. Проверьте консоль браузера
3. Проверьте Network tab в DevTools
4. Обратитесь к документации Telegram

## 📚 Resources

- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [Telegram WebApp Documentation](https://core.telegram.org/bots/webapps)
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

**Last Updated:** 2024

