# Quick Deploy to Render.com

## 🚀 3-Minute Deployment Guide

### Prerequisites
- [ ] GitHub account and repository
- [ ] Render.com account (free tier available)
- [ ] OpenAI API key (for AI features)

### Step 1: Push to GitHub
```bash
# If not already done
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

### Step 2: Create Web Service on Render
1. Go to [render.com](https://render.com) → Login
2. **"New +"** → **"Web Service"**
3. Connect GitHub and select your repository

### Step 3: Configure Service
**Basic Settings:**
- Name: `construction-erp-app`
- Environment: **Node**
- Branch: `main`

**Build & Deploy:**
```bash
Build Command: npm install && npm run db:generate && npm run build
Start Command: npm start
```

**Advanced:**
- Node Version: `18`
- Auto-Deploy: **Yes**

### Step 4: Add Environment Variables
Click **"Environment"** tab and add:

#### Essential (Required)
```bash
NODE_ENV=production
PORT=10000
JWT_SECRET=your-super-secure-jwt-secret-key-minimum-32-characters
OPENAI_API_KEY=sk-your-openai-api-key-here
```

#### Database (Add after creating PostgreSQL service)
```bash
DATABASE_URL=postgresql://user:pass@host:port/db
```

### Step 5: Create Database
1. **"New +"** → **"PostgreSQL"**
2. Name: `construction-erp-db`
3. Copy **External Database URL**
4. Add to web service as `DATABASE_URL`

### Step 6: Deploy!
Click **"Create Web Service"** - Render will build and deploy automatically.

### Step 7: Run Migrations (After Deploy)
1. Go to your service → **"Shell"** tab
2. Run: `npm run db:migrate:deploy`

## ✅ Success!
Your app will be live at: `https://construction-erp-app.onrender.com`

- Health check: `/health`
- API docs: `/api/docs`
- Dashboard: `/`

---

## 🔧 Using the Deployment Script

Run the automated deployment script:
```bash
./scripts/deploy-render.sh
```

This script will:
- ✅ Check git status and push changes
- ✅ Verify all essential files exist
- ✅ Provide step-by-step deployment instructions
- ✅ Create environment variables template

---

## 📋 Environment Variables Checklist

Copy from `render.env.template`:

### Required for Basic Functionality
- [ ] `NODE_ENV=production`
- [ ] `PORT=10000`
- [ ] `DATABASE_URL` (from PostgreSQL service)
- [ ] `JWT_SECRET` (generate secure 32+ char string)

### Required for AI Features  
- [ ] `OPENAI_API_KEY` (from OpenAI dashboard)

### Optional but Recommended
- [ ] `REDIS_URL` (for caching/real-time features)
- [ ] `LOG_LEVEL=info`
- [ ] `ENABLE_AI_FEATURES=true`

### Email Notifications (Optional)
- [ ] `SMTP_HOST=smtp.gmail.com`
- [ ] `SMTP_PORT=587`
- [ ] `SMTP_USER=your-email@gmail.com`
- [ ] `SMTP_PASS=your-app-password`

---

## 🆘 Troubleshooting

### Build Failed?
- Check build logs in Render dashboard
- Ensure all dependencies are in `package.json`
- Verify Node version is 18+

### Database Connection Issues?
- Verify `DATABASE_URL` format is correct
- Ensure PostgreSQL service is running
- Check database accepts external connections

### App Won't Start?
- Ensure `PORT=10000` in environment variables
- Check start command is `npm start`
- Verify `dist/main.js` exists after build

### Need Help?
- See full guide: `RENDER_DEPLOYMENT_GUIDE.md`
- Check Render docs: https://render.com/docs
- Review application logs in Render dashboard

---

## 🎯 Quick Commands

```bash
# Test build locally
npm run build

# Check health endpoint locally  
npm run dev
# Visit: http://localhost:3000/health

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate:deploy
```

Your Construction ERP is production-ready! 🚀
