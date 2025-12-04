# 🚀 Deployment Guide - Outlivion Mini App

Полное руководство по развертыванию Outlivion Mini App на различных платформах.

---

## 📋 Предварительные требования

### Обязательно
- Node.js 20+
- npm или pnpm
- Telegram Bot Token
- Доступ к Outlivion API

### Опционально
- Docker (для контейнеризации)
- Vercel аккаунт (для автоматического деплоя)
- Domain (для production)

---

## 🌐 Vercel Deployment (Рекомендуется)

### Шаг 1: Подготовка

```bash
# Установить Vercel CLI
npm i -g vercel

# Войти в аккаунт
vercel login
```

### Шаг 2: Конфигурация

Создайте `.env.production`:

```env
NEXT_PUBLIC_API_URL=https://api.outlivion.space
NEXT_PUBLIC_TELEGRAM_BOT_NAME=outlivionbot
NEXT_PUBLIC_MINIAPP_URL=https://app.outlivion.space
NEXT_PUBLIC_APP_VERSION=2.0.0

TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_WEBHOOK_SECRET=your_webhook_secret_32_chars
```

### Шаг 3: Deploy

```bash
# Development preview
vercel

# Production
vercel --prod
```

### Шаг 4: Environment Variables в Vercel Dashboard

1. Откройте https://vercel.com/dashboard
2. Выберите проект
3. Settings → Environment Variables
4. Добавьте все переменные из `.env.production`
5. Redeploy проект

### Шаг 5: Domain Setup

1. Settings → Domains
2. Добавьте `app.outlivion.space`
3. Настройте DNS записи:
   ```
   A     app.outlivion.space  →  76.76.21.21
   CNAME www                  →  cname.vercel-dns.com
   ```

### Шаг 6: Настройка Telegram Bot

```bash
# Установить webhook
npm run setup:webhook

# Проверить статус
npm run bot:diagnostics
```

---

## 🐳 Docker Deployment

### Шаг 1: Build Image

```bash
# Build
docker build -t outlivion-miniapp:latest .

# Tag for registry
docker tag outlivion-miniapp:latest registry.outlivion.space/miniapp:latest
```

### Шаг 2: Run Container

```bash
docker run -d \
  --name outlivion-miniapp \
  -p 3002:3002 \
  -e NEXT_PUBLIC_API_URL=https://api.outlivion.space \
  -e TELEGRAM_BOT_TOKEN=your_token \
  --restart unless-stopped \
  outlivion-miniapp:latest
```

### Шаг 3: Используя Docker Compose

```bash
# Создать .env файл
cp env.example .env
# Отредактировать .env с production значениями

# Start
docker-compose up -d

# Logs
docker-compose logs -f miniapp

# Stop
docker-compose down
```

### Шаг 4: Health Check

```bash
# Check container health
docker ps

# Check API
curl http://localhost:3002/api/health
```

---

## 🔧 Manual Deployment (VPS/Server)

### Шаг 1: Server Setup

```bash
# SSH в сервер
ssh user@server.outlivion.space

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2
```

### Шаг 2: Deploy Application

```bash
# Clone repository
git clone https://github.com/outlivion/outlivion-miniapp.git
cd outlivion-miniapp

# Install dependencies
npm ci --only=production

# Build
npm run build

# Setup environment
cp env.example .env
nano .env  # Edit with production values
```

### Шаг 3: PM2 Configuration

Создайте `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'outlivion-miniapp',
    script: 'npm',
    args: 'start',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3002,
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
  }],
};
```

```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 config
pm2 save

# Setup PM2 startup
pm2 startup
# Follow instructions
```

### Шаг 4: Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/miniapp
server {
    listen 80;
    server_name app.outlivion.space;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/miniapp /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Reload
sudo systemctl reload nginx

# Setup SSL with Certbot
sudo certbot --nginx -d app.outlivion.space
```

---

## ✅ Post-Deployment Checklist

### Vercel
- [ ] Environment variables configured
- [ ] Domain connected and SSL active
- [ ] Webhook configured in Telegram
- [ ] Health check endpoint working (`/api/health`)
- [ ] Test Telegram Mini App opening
- [ ] Check logs in Vercel dashboard

### Docker
- [ ] Container running and healthy
- [ ] Logs are being generated
- [ ] Health check passing
- [ ] Restart policy configured
- [ ] Volumes mounted correctly (if any)

### Manual/VPS
- [ ] PM2 running and monitoring
- [ ] Nginx reverse proxy working
- [ ] SSL certificate installed
- [ ] Firewall configured (allow 80, 443, 22)
- [ ] Logs rotation configured
- [ ] Monitoring setup (optional: Prometheus, Grafana)
- [ ] Backups configured

---

## 🔍 Troubleshooting

### Issue: Telegram Mini App not opening

**Check:**
```bash
# Verify webhook
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo

# Expected response:
{
  "url": "https://app.outlivion.space/api/bot",
  "has_custom_certificate": false,
  "pending_update_count": 0
}
```

**Fix:**
```bash
npm run setup:webhook
```

### Issue: API connection errors

**Check:**
```bash
# Test API connectivity
curl https://api.outlivion.space/health

# Check from app
curl https://app.outlivion.space/api/health
```

**Fix:**
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check CORS settings in API
- Verify API is running

### Issue: Build errors

**Check:**
```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

**Common causes:**
- Missing environment variables
- TypeScript errors
- Dependency conflicts

### Issue: Memory issues (VPS)

**Fix:**
```bash
# Increase Node memory
NODE_OPTIONS="--max-old-space-size=2048" npm run build

# Reduce PM2 instances
pm2 scale outlivion-miniapp 1
```

---

## 📊 Monitoring

### Health Check Endpoint

```bash
# Check application health
curl https://app.outlivion.space/api/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-12-04T...",
  "version": "2.0.0",
  "uptime": 12345,
  "environment": "production",
  "services": {
    "api": {
      "status": "ok",
      "url": "https://api.outlivion.space"
    },
    "telegram": {
      "status": "ok",
      "botName": "outlivionbot",
      "hasToken": true
    }
  }
}
```

### Logs

**Vercel:**
```bash
vercel logs --follow
```

**Docker:**
```bash
docker logs -f outlivion-miniapp
```

**PM2:**
```bash
pm2 logs outlivion-miniapp
pm2 monit
```

---

## 🔄 Updates and Rollback

### Vercel
```bash
# Deploy new version
git push origin main  # Auto-deploys

# Rollback
vercel rollback
```

### Docker
```bash
# Pull new image
docker pull registry.outlivion.space/miniapp:latest

# Stop old container
docker stop outlivion-miniapp
docker rm outlivion-miniapp

# Start new
docker run -d --name outlivion-miniapp ...

# Rollback (use specific tag)
docker run -d --name outlivion-miniapp registry.outlivion.space/miniapp:v1.9.0
```

### Manual/PM2
```bash
# Pull updates
git pull origin main

# Install dependencies
npm ci --only=production

# Build
npm run build

# Restart
pm2 restart outlivion-miniapp

# Rollback
git checkout v1.9.0
npm ci --only=production
npm run build
pm2 restart outlivion-miniapp
```

---

## 🔐 Security Checklist

- [ ] All secrets in environment variables (не в коде)
- [ ] HTTPS enabled (SSL certificate)
- [ ] Security headers configured
- [ ] Rate limiting enabled in API
- [ ] Firewall configured
- [ ] Regular updates (`npm audit fix`)
- [ ] Logs не содержат sensitive data
- [ ] Telegram webhook uses secret token

---

## 📞 Support

**Issues:** https://github.com/outlivion/outlivion-miniapp/issues
**Docs:** https://github.com/outlivion/outlivion-miniapp/wiki
**Email:** support@outlivion.space

---

**Last Updated:** December 2025  
**Version:** 2.0.0
