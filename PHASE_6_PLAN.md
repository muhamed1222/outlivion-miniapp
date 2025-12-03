# 🚀 PHASE 6: Production Deployment

**Статус:** 🔜 В РАБОТЕ  
**Дата старта:** 3 декабря 2025, 19:40

---

## 🎯 Цель Phase 6

**Production Deployment** полного стека Outlivion VPN Platform:
- ✅ Deploy Backend API (Railway/Fly.io)
- ✅ Deploy Frontend (Vercel)
- ✅ Setup Production Database
- ✅ Configure Domains
- ✅ Environment Variables
- ✅ Final Testing

---

## 📋 Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│  PRODUCTION ARCHITECTURE                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Users                                                  │
│    │                                                    │
│    ├──> app.outlivion.space (Vercel)                   │
│    │      └─> Telegram Mini App + Web Portal          │
│    │          ├─> /telegram/*                          │
│    │          └─> /web/*                               │
│    │                                                    │
│    └──> api.outlivion.space (Railway/Fly.io)          │
│           └─> Backend API                              │
│               ├─> Auth endpoints                       │
│               ├─> User endpoints                       │
│               ├─> Billing endpoints                    │
│               └─> Server endpoints                     │
│                                                         │
│  Database: PostgreSQL (Neon/Supabase/Railway)         │
│  VPN: Marzban API                                      │
│  Payments: Mercuryo                                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🗂️ Deployment Plan

### Step 1: Production Database Setup

**Options:**

#### Option A: Neon PostgreSQL (Recommended)
```bash
# 1. Go to https://neon.tech
# 2. Create new project "outlivion"
# 3. Copy connection string
# Format: postgresql://user:pass@ep-xxx.region.aws.neon.tech/outlivion
```

**Pros:**
- ✅ Free tier (0.5 GB storage)
- ✅ Auto-scaling
- ✅ Built-in connection pooling
- ✅ Fast setup (~2 min)

#### Option B: Supabase
```bash
# 1. Go to https://supabase.com
# 2. Create project
# 3. Get Database → Connection string → URI
```

**Pros:**
- ✅ Free tier (500 MB database)
- ✅ Additional features (Storage, Auth, Edge Functions)
- ✅ Good dashboard

#### Option C: Railway PostgreSQL
```bash
# 1. Railway.app
# 2. New Project → Add PostgreSQL
# 3. Copy DATABASE_URL from Variables
```

**Pros:**
- ✅ $5 credit free
- ✅ Same platform as backend
- ✅ Easy integration

**Recommendation:** **Neon** - быстро, бесплатно, надёжно.

---

### Step 2: Backend Deployment (Railway)

#### Why Railway?
- ✅ Easy deployment from GitHub
- ✅ Automatic HTTPS
- ✅ Free $5 credit
- ✅ Good for Node.js/Express
- ✅ Environment variables management

#### Deployment Steps:

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Initialize (from outlivion-api directory)
cd outlivion-api
railway init

# 4. Link to GitHub (optional but recommended)
railway link

# 5. Set environment variables
railway variables set DATABASE_URL="postgresql://..."
railway variables set TELEGRAM_BOT_TOKEN="..."
railway variables set JWT_SECRET="..."
railway variables set JWT_REFRESH_SECRET="..."
railway variables set NODE_ENV="production"
railway variables set PORT="3001"

# 6. Deploy
railway up

# 7. Get URL
railway domain
# Example: outlivion-api.up.railway.app
```

#### Alternative: Fly.io

```bash
# 1. Install Fly CLI
brew install flyctl

# 2. Login
fly auth login

# 3. Launch app
cd outlivion-api
fly launch

# 4. Set secrets
fly secrets set DATABASE_URL="..."
fly secrets set TELEGRAM_BOT_TOKEN="..."

# 5. Deploy
fly deploy
```

---

### Step 3: Frontend Deployment (Vercel)

#### Why Vercel?
- ✅ Built for Next.js
- ✅ Automatic deployments from Git
- ✅ Edge Functions support
- ✅ Free tier generous
- ✅ Custom domains easy

#### Deployment Steps:

```bash
# Option 1: Vercel CLI
npm install -g vercel
cd outlivion-miniapp
vercel

# Option 2: GitHub Integration (Recommended)
# 1. Go to https://vercel.com
# 2. Import Git Repository
# 3. Select outlivion-miniapp
# 4. Configure:
#    - Framework: Next.js
#    - Root Directory: ./
#    - Build Command: npm run build
#    - Output Directory: .next
# 5. Add Environment Variables:
#    NEXT_PUBLIC_API_URL=https://api.outlivion.space
#    NEXT_PUBLIC_TELEGRAM_BOT_NAME=outlivionbot
#    TELEGRAM_BOT_TOKEN=your_token
# 6. Deploy!
```

---

### Step 4: Environment Variables

#### Backend (.env / Railway Variables):
```env
# Database
DATABASE_URL=postgresql://user:pass@host.neon.tech/outlivion

# Telegram
TELEGRAM_BOT_TOKEN=8477147639:AAEVS_D_A4avYXPOku78AWiYbiirOgglpbw

# JWT (IMPORTANT: Generate strong secrets!)
JWT_SECRET=your_super_long_secret_key_at_least_32_characters_production
JWT_REFRESH_SECRET=your_super_long_refresh_secret_key_at_least_32_characters

# Production
NODE_ENV=production
PORT=3001
ALLOW_MOCK_AUTH=false  # IMPORTANT: Disable in production!

# Mercuryo Payment
MERCURYO_WIDGET_ID=your_widget_id
MERCURYO_SECRET=your_secret

# Marzban VPN
MARZBAN_API_URL=https://your-marzban-server.com
MARZBAN_USERNAME=admin
MARZBAN_PASSWORD=your_password
```

#### Frontend (Vercel Environment Variables):
```env
NEXT_PUBLIC_API_URL=https://api.outlivion.space
NEXT_PUBLIC_TELEGRAM_BOT_NAME=outlivionbot
TELEGRAM_BOT_TOKEN=8477147639:AAEVS_D_A4avYXPOku78AWiYbiirOgglpbw
```

---

### Step 5: Domain Configuration

#### Setup Domains:

**Backend API:**
```
api.outlivion.space → Railway/Fly.io deployment
```

**Frontend:**
```
app.outlivion.space → Vercel deployment
```

#### DNS Configuration (Cloudflare/Domain Provider):

```
# A Records or CNAME
api.outlivion.space   CNAME  your-app.up.railway.app
app.outlivion.space   CNAME  cname.vercel-dns.com

# Or if using Railway custom domain:
1. Railway dashboard → Settings → Domains
2. Add custom domain: api.outlivion.space
3. Follow DNS instructions

# Vercel custom domain:
1. Vercel dashboard → Settings → Domains
2. Add: app.outlivion.space
3. Configure DNS as instructed
```

---

### Step 6: Database Migrations

```bash
# After database setup, run migrations
# Option 1: From local
DATABASE_URL="postgresql://..." npm run db:migrate

# Option 2: From Railway
railway run npm run db:migrate

# Option 3: Seed data
railway run npm run db:seed
```

---

### Step 7: Telegram Bot Configuration

#### Update Bot Domain in BotFather:

```
1. Open @BotFather in Telegram
2. /mybots → Select your bot
3. Bot Settings → Domain
4. Add: app.outlivion.space

5. Menu Button → Web App
6. URL: https://app.outlivion.space/telegram

7. Bot Description:
   "Outlivion VPN - Быстрый и безопасный VPN сервис"
```

---

### Step 8: Testing Checklist

#### Backend API:
- [ ] `https://api.outlivion.space/health`
- [ ] `https://api.outlivion.space/billing/tariffs`
- [ ] `POST https://api.outlivion.space/auth/telegram`

#### Frontend:
- [ ] `https://app.outlivion.space/` (auto-redirect)
- [ ] `https://app.outlivion.space/telegram` (Mini App)
- [ ] `https://app.outlivion.space/web` (Web Portal)
- [ ] `https://app.outlivion.space/web/login`

#### Integration:
- [ ] Open Mini App from Telegram bot
- [ ] Auto-login works
- [ ] API calls successful
- [ ] Data loads correctly
- [ ] Navigation works
- [ ] Payments redirect to Mercuryo

---

## 📊 Deployment Checklist

### Pre-Deployment:
- [ ] GitHub repository ready
- [ ] .gitignore configured (excludes .env, node_modules)
- [ ] Production database created
- [ ] Strong JWT secrets generated
- [ ] Telegram bot token (production)
- [ ] Mercuryo account setup
- [ ] Marzban VPN configured

### Backend Deployment:
- [ ] Railway/Fly.io account created
- [ ] Project initialized
- [ ] Environment variables set
- [ ] Database connected
- [ ] Migrations run
- [ ] API deployed
- [ ] Custom domain configured
- [ ] HTTPS working

### Frontend Deployment:
- [ ] Vercel account created
- [ ] Repository imported
- [ ] Build settings configured
- [ ] Environment variables set
- [ ] Deployment successful
- [ ] Custom domain configured
- [ ] Routes working

### Post-Deployment:
- [ ] Backend health check passes
- [ ] Frontend loads correctly
- [ ] Auth flow works
- [ ] API integration works
- [ ] Telegram Mini App opens
- [ ] Web Portal accessible
- [ ] Payment flow tested
- [ ] Error tracking setup (optional)
- [ ] Monitoring setup (optional)

---

## 🔐 Security Checklist

- [ ] **JWT Secrets:** Long, random, secure (32+ chars)
- [ ] **DATABASE_URL:** Not exposed in frontend
- [ ] **ALLOW_MOCK_AUTH:** Set to `false` in production
- [ ] **HTTPS:** Enabled on all endpoints
- [ ] **CORS:** Configured for production domains only
- [ ] **Rate Limiting:** Enabled on API
- [ ] **Helmet:** Security headers enabled
- [ ] **Env Files:** Never committed to Git
- [ ] **API Keys:** Stored in environment variables
- [ ] **Database:** Password protected, SSL enabled

---

## 💰 Cost Estimate

### Free Tier (Recommended for Start):
```
Database (Neon):      $0/month (Free tier)
Backend (Railway):    $5 credit → ~1-2 months free
Frontend (Vercel):    $0/month (Hobby plan)
Domain:               ~$10-15/year
──────────────────────────────────────
TOTAL START:          ~$15/year (just domain!)
```

### Paid Tier (When Scaling):
```
Database (Neon Pro):  $19/month
Backend (Railway):    ~$10-20/month
Frontend (Vercel):    $20/month (Pro plan, optional)
──────────────────────────────────────
TOTAL MONTHLY:        ~$29-59/month
```

---

## 🚀 Quick Deployment Commands

### Backend (Railway):
```bash
cd outlivion-api
railway login
railway init
railway variables set DATABASE_URL="..." \
  TELEGRAM_BOT_TOKEN="..." \
  JWT_SECRET="..." \
  JWT_REFRESH_SECRET="..." \
  NODE_ENV="production"
railway up
railway domain
```

### Frontend (Vercel):
```bash
cd outlivion-miniapp
vercel
# Follow prompts
vercel --prod
```

---

## 📝 Environment Setup Scripts

### Generate Strong Secrets:
```bash
# Generate JWT secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Test Production API:
```bash
# Test health
curl https://api.outlivion.space/health

# Test tariffs
curl https://api.outlivion.space/billing/tariffs

# Test auth (with real initData from Telegram)
curl -X POST https://api.outlivion.space/auth/telegram \
  -H "Content-Type: application/json" \
  -d '{"initData":"..."}'
```

---

## 🎯 Success Criteria

### Backend:
- ✅ API accessible via HTTPS
- ✅ All endpoints responding
- ✅ Database connected
- ✅ Auth working
- ✅ No errors in logs

### Frontend:
- ✅ Site accessible via HTTPS
- ✅ All routes working
- ✅ Auto-redirect functional
- ✅ Mini App opens in Telegram
- ✅ Web Portal accessible in browser

### Integration:
- ✅ API calls from frontend work
- ✅ Auth flow complete
- ✅ Data persists
- ✅ No CORS errors
- ✅ Production-ready

---

## 📚 Documentation Links

- **Railway:** https://docs.railway.app
- **Vercel:** https://vercel.com/docs
- **Neon:** https://neon.tech/docs
- **Telegram Bot API:** https://core.telegram.org/bots/api
- **Next.js Deployment:** https://nextjs.org/docs/deployment

---

**Время оценка:** ~2-3 hours (first time)  
**Сложность:** Medium  
**Приоритет:** HIGH - Final step!

---

*Phase 6 Plan - Outlivion VPN Platform*  
*Created: 3 декабря 2025, 19:40*  
*Last phase before PRODUCTION! 🚀*

