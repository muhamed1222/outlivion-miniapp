# 🚀 DEPLOYMENT GUIDE - Outlivion VPN Platform

**Версия:** 2.0.0 (Unified Frontend)  
**Дата:** 3 декабря 2025

---

## 📋 Quick Start Deployment

### Prerequisites:
- ✅ GitHub account
- ✅ Vercel account (free)
- ✅ Railway/Fly.io account (free tier)
- ✅ Domain (optional, можно использовать provided subdomains)

---

## 🗂️ Architecture Overview

```
Frontend (Vercel):     app.outlivion.space
  ├─> /telegram        → Telegram Mini App
  └─> /web             → Web Portal

Backend (Railway):     api.outlivion.space
  └─> Express API      → All endpoints

Database:              PostgreSQL (Neon/Railway)
VPN Service:           Marzban API
Payments:              Mercuryo
```

---

## 📦 Step-by-Step Deployment

### STEP 1: Setup Production Database (5 min)

#### Option A: Neon PostgreSQL (Recommended)

1. **Go to** https://neon.tech
2. **Create account** (free)
3. **Create project:**
   - Name: `outlivion-production`
   - Region: Choose closest
4. **Copy connection string:**
   ```
   postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```
5. **Save it** - you'll need this for backend!

#### Option B: Railway PostgreSQL

1. Go to https://railway.app
2. New Project → Add PostgreSQL
3. Copy `DATABASE_URL` from Variables tab

---

### STEP 2: Deploy Backend API (10 min)

#### Using Railway (Recommended):

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Navigate to backend
cd outlivion-api

# 4. Initialize Railway project
railway init
# Name: outlivion-api

# 5. Set environment variables
railway variables set DATABASE_URL="postgresql://..." \\
  TELEGRAM_BOT_TOKEN="8477147639:AAEVS_D_A4avYXPOku78AWiYbiirOgglpbw" \\
  NODE_ENV="production" \\
  PORT="3001"

# 6. Generate and set JWT secrets (IMPORTANT!)
# Generate secret:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Set it:
railway variables set JWT_SECRET="generated_secret_here"
railway variables set JWT_REFRESH_SECRET="another_generated_secret"

# 7. IMPORTANT: Disable mock auth
railway variables set ALLOW_MOCK_AUTH="false"

# 8. Deploy!
railway up

# 9. Get your API URL
railway domain
# Example: outlivion-api.up.railway.app
```

#### Setup Custom Domain (Optional):

```bash
# In Railway dashboard:
# Settings → Domains → Add Custom Domain
# Enter: api.outlivion.space
# Follow DNS instructions
```

---

### STEP 3: Run Database Migrations (2 min)

```bash
# Option 1: From local with Railway
railway run npm run db:migrate

# Option 2: Direct with connection string
DATABASE_URL="your_db_url" npm run db:migrate

# Check if successful
railway logs
```

---

### STEP 4: Deploy Frontend (10 min)

#### Using Vercel (Recommended):

**Method 1: Vercel CLI**

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Navigate to frontend
cd outlivion-miniapp

# 3. Login
vercel login

# 4. Deploy
vercel

# Follow prompts:
# - Setup project? Y
# - Which scope? Your account
# - Link to existing? N
# - Project name? outlivion-app
# - Directory? ./
# - Override settings? N

# 5. Add environment variables
vercel env add NEXT_PUBLIC_API_URL production
# Enter: https://your-api.up.railway.app
# (or https://api.outlivion.space if custom domain)

vercel env add NEXT_PUBLIC_TELEGRAM_BOT_NAME production
# Enter: outlivionbot

vercel env add TELEGRAM_BOT_TOKEN production
# Enter: 8477147639:AAEVS_D_A4avYXPOku78AWiYbiirOgglpbw

# 6. Deploy to production
vercel --prod
```

**Method 2: GitHub Integration (Easier)**

1. **Push to GitHub:**
   ```bash
   cd outlivion-miniapp
   git remote add origin https://github.com/yourusername/outlivion-app.git
   git push -u origin main
   ```

2. **Go to** https://vercel.com/new
3. **Import Git Repository**
4. **Select** outlivion-miniapp repo
5. **Configure:**
   - Framework Preset: Next.js
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

6. **Add Environment Variables:**
   ```
   NEXT_PUBLIC_API_URL=https://api.outlivion.space
   NEXT_PUBLIC_TELEGRAM_BOT_NAME=outlivionbot
   TELEGRAM_BOT_TOKEN=8477147639:AAEVS_D_A4avYXPOku78AWiYbiirOgglpbw
   ```

7. **Deploy!**

---

### STEP 5: Configure Custom Domains (5 min)

#### Frontend Domain: app.outlivion.space

**In Vercel:**
1. Project Settings → Domains
2. Add Domain: `app.outlivion.space`
3. Follow DNS instructions

**In your DNS provider (Cloudflare/Namecheap/etc):**
```
Type: CNAME
Name: bot
Value: cname.vercel-dns.com
```

#### Backend Domain: api.outlivion.space

**In Railway:**
1. Settings → Domains → Add Custom Domain
2. Enter: `api.outlivion.space`

**In your DNS:**
```
Type: CNAME
Name: api
Value: your-app.up.railway.app
```

---

### STEP 6: Configure Telegram Bot (3 min)

Open @BotFather in Telegram:

```
1. /mybots
2. Select @outlivionbot
3. Edit Bot → Bot Settings → Domain
   Add: app.outlivion.space

4. Menu Button → Edit Menu Button URL
   URL: https://app.outlivion.space/telegram

5. Bot Description:
   "Outlivion VPN - Быстрый и безопасный VPN сервис.
   Безлимитный трафик, высокая скорость, до 3 устройств."

6. About:
   "Защити свою приватность в интернете с Outlivion VPN"
```

---

### STEP 7: Testing (10 min)

#### Backend API Tests:

```bash
# Health check
curl https://api.outlivion.space/health

# Tariffs endpoint
curl https://api.outlivion.space/billing/tariffs

# Should return JSON with 4 tariffs
```

#### Frontend Tests:

1. **Open in browser:** https://app.outlivion.space
   - Should redirect to /web or /telegram

2. **Web Portal:** https://app.outlivion.space/web
   - Should show login page

3. **Mini App:** Open Telegram bot
   - Click "Open Mini App" button
   - Should open https://app.outlivion.space/telegram

#### Integration Test:

1. Open Mini App from Telegram
2. Should auto-login
3. Check browser console (no errors)
4. Navigate between pages
5. Check API calls (Network tab)

---

## 🔐 Security Checklist

Before going live:

- [ ] **JWT_SECRET** - Long random string (32+ chars)
- [ ] **JWT_REFRESH_SECRET** - Different from JWT_SECRET
- [ ] **ALLOW_MOCK_AUTH** - Set to `false` in production
- [ ] **DATABASE_URL** - Not exposed in frontend
- [ ] **HTTPS** - Enabled on all endpoints
- [ ] **.env files** - Never committed to Git
- [ ] **CORS** - Configured for production domains

---

## 🐛 Troubleshooting

### Backend not starting:

```bash
# Check logs
railway logs

# Common issues:
# - DATABASE_URL not set
# - JWT_SECRET too short (needs 32+ chars)
# - Missing environment variables
```

### Frontend build fails:

```bash
# Check Vercel logs
vercel logs

# Common issues:
# - Missing NEXT_PUBLIC_API_URL
# - API URL incorrect
# - Build errors (run locally first)
```

### CORS errors:

```bash
# Check backend CORS config
# Add frontend domain to allowed origins
```

### Auth not working:

```bash
# Check:
# 1. ALLOW_MOCK_AUTH=false in production
# 2. TELEGRAM_BOT_TOKEN correct
# 3. Domain configured in BotFather
```

---

## 📊 Post-Deployment Checklist

- [ ] Backend health check passes
- [ ] Frontend loads correctly
- [ ] All routes work
- [ ] Telegram Mini App opens
- [ ] Web Portal accessible
- [ ] Auth flow works end-to-end
- [ ] API calls successful
- [ ] No console errors
- [ ] Mobile responsive
- [ ] SSL certificates valid

---

## 🎉 Success!

If all checks pass, **you're live!** 🚀

Share your app:
- Bot: https://t.me/outlivionbot
- Web: https://app.outlivion.space

---

## 📚 Additional Resources

- **Monitor Backend:** Railway dashboard
- **Monitor Frontend:** Vercel dashboard
- **Check Logs:** `railway logs` / Vercel logs
- **Update Env Vars:** Railway/Vercel dashboards

---

## 🔄 CI/CD (Automatic Deployments)

### Vercel:
- ✅ Auto-deploys on `git push` to main
- ✅ Preview deployments for PRs

### Railway:
- ✅ Auto-deploys on push (if GitHub linked)
- ✅ Manual deploy: `railway up`

---

## 💰 Cost Summary

**Free Tier (Sufficient for start):**
- Database (Neon): FREE (0.5 GB)
- Backend (Railway): $5 credit
- Frontend (Vercel): FREE (Hobby plan)
- **Total: $0-5/month for 1-2 months**

**Paid Tier (When scaling):**
- Database: $19/month
- Backend: $10-20/month
- Frontend: $0 (or $20 Pro)
- **Total: ~$30-40/month**

---

## 📞 Support

**Issues?**
- Railway docs: https://docs.railway.app
- Vercel docs: https://vercel.com/docs
- Neon docs: https://neon.tech/docs

---

**Deployment Guide - Outlivion VPN Platform v2.0.0**  
*From zero to production in ~30 minutes!* 🚀

