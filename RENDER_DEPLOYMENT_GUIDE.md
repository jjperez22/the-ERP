# Construction ERP - Render.com Deployment Guide

This guide provides step-by-step instructions for deploying your AI-Powered Construction ERP application on Render.com.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Deployment Methods](#deployment-methods)
3. [Method 1: Native Node.js Deployment (Recommended)](#method-1-native-nodejs-deployment-recommended)
4. [Method 2: Docker Deployment](#method-2-docker-deployment)
5. [Database Setup](#database-setup)
6. [Environment Variables](#environment-variables)
7. [Post-Deployment Setup](#post-deployment-setup)
8. [Troubleshooting](#troubleshooting)
9. [Monitoring and Maintenance](#monitoring-and-maintenance)

## Prerequisites

1. **GitHub Repository**: Your code must be in a GitHub repository
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **Environment Variables**: Prepare all required environment variables
4. **Database**: Set up PostgreSQL database (can be done on Render)
5. **API Keys**: Obtain OpenAI API key and other third-party service keys

## Deployment Methods

Render.com supports two main deployment methods for Node.js applications:
- **Native Node.js** (Recommended): Uses Render's Node.js runtime
- **Docker**: Uses your custom Dockerfile

## Method 1: Native Node.js Deployment (Recommended)

### Step 1: Create a New Web Service

1. Log in to your Render dashboard
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select your Construction ERP repository

### Step 2: Configure Build Settings

Fill in the following configuration:

#### Basic Settings
- **Name**: `construction-erp-app` (or your preferred name)
- **Environment**: `Node`
- **Region**: Choose closest to your users (e.g., `Oregon (US West)`)
- **Branch**: `main` (or your deployment branch)
- **Runtime**: `Node`

#### Build & Deploy Settings
- **Build Command**: 
  ```bash
  npm install && npm run db:generate && npm run build
  ```
- **Start Command**: 
  ```bash
  npm start
  ```

#### Advanced Settings
- **Node Version**: `18` (matches your engines requirement)
- **Auto-Deploy**: `Yes` (deploys automatically on git push)

### Step 3: Environment Variables

Add the following environment variables in Render dashboard:

#### Required Variables
```bash
NODE_ENV=production
PORT=10000
DATABASE_URL=your-postgres-connection-string
JWT_SECRET=your-super-secure-jwt-secret-key-minimum-32-characters
OPENAI_API_KEY=your-openai-api-key
```

#### Optional Variables
```bash
REDIS_URL=your-redis-connection-string
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
MAX_FILE_SIZE=10485760
ENABLE_AI_FEATURES=true
ENABLE_REAL_TIME=true
ENABLE_AUTOMATION=true
ENABLE_ANALYTICS=true
```

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Render will automatically start building and deploying your application
3. Monitor the build logs for any issues
4. Once deployed, you'll get a URL like `https://construction-erp-app.onrender.com`

## Method 2: Docker Deployment

### Step 1: Create Docker Web Service

1. In Render dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Select **"Docker"** as the environment

### Step 2: Fix Dockerfile for Production

Your current Dockerfile needs a small fix. The build stage should install all dependencies (including dev dependencies) to build the app:

```dockerfile
# AI-Powered Construction ERP - Multi-stage Docker Build
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies for building)
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Generate Prisma client and build the application
RUN npm run db:generate && npm run build

# Production stage
FROM node:18-alpine AS production

# Install dumb-init and curl for health checks
RUN apk add --no-cache dumb-init curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S appuser -u 1001

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=appuser:nodejs /app/dist ./dist
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/package*.json ./
COPY --from=builder --chown=appuser:nodejs /app/prisma ./prisma

# Create uploads directory
RUN mkdir -p uploads && chown appuser:nodejs uploads

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
```

### Step 3: Configure Docker Service

- **Name**: `construction-erp-docker`
- **Environment**: `Docker`
- **Dockerfile Path**: `./Dockerfile`
- **Docker Context Directory**: `.` (root directory)
- Add the same environment variables as in Method 1

## Database Setup

### Option 1: Render PostgreSQL (Recommended)

1. In Render dashboard, click **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name**: `construction-erp-db`
   - **Database Name**: `construction_erp`
   - **User**: `construction_erp_user`
   - **Region**: Same as your web service
   - **Plan**: Free or paid based on your needs

3. After creation, copy the **External Database URL**
4. Add it to your web service as `DATABASE_URL` environment variable

### Option 2: External Database

If using an external PostgreSQL database:
1. Ensure it's accessible from Render's IP ranges
2. Create database and user with proper permissions
3. Use the connection string in `DATABASE_URL`

## Environment Variables

### Setting Environment Variables in Render

1. Go to your web service settings
2. Click **"Environment"** tab
3. Add each variable with **"Add Environment Variable"**
4. **Important**: Mark sensitive variables as **"Secret"**

### Required Environment Variables

```bash
# Essential
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-super-secure-jwt-secret-key-minimum-32-characters

# AI Services
OPENAI_API_KEY=your-openai-api-key

# Optional but Recommended
REDIS_URL=redis://user:password@host:port
LOG_LEVEL=info
ENABLE_AI_FEATURES=true
```

## Post-Deployment Setup

### Step 1: Database Migration

After successful deployment, run database migrations:

1. Go to your service dashboard
2. Open **"Shell"** tab
3. Run:
   ```bash
   npm run db:migrate:deploy
   ```

### Step 2: Seed Database (Optional)

If you have seed data:
```bash
npm run db:seed
```

### Step 3: Verify Deployment

1. Visit your application URL
2. Check health endpoint: `https://your-app.onrender.com/health`
3. Test API endpoints: `https://your-app.onrender.com/api/docs` (Swagger UI)

## Troubleshooting

### Common Issues

#### 1. Build Failures

**Problem**: `npm ci --only=production` fails during build
```
Solution: Change build command to:
npm install && npm run db:generate && npm run build
```

#### 2. Database Connection Issues

**Problem**: Cannot connect to database
```
Solutions:
- Verify DATABASE_URL format
- Check database is running and accessible
- Ensure database allows connections from Render IPs
```

#### 3. Missing Dependencies

**Problem**: Module not found errors
```
Solutions:
- Ensure all dependencies are in package.json
- Check if devDependencies are needed for build
- Verify TypeScript compilation is working
```

#### 4. Environment Variables Not Loading

**Problem**: Application can't read environment variables
```
Solutions:
- Verify variables are set in Render dashboard
- Check variable names match exactly
- Ensure sensitive variables are marked as "Secret"
```

#### 5. Port Issues

**Problem**: Application won't start or is unreachable
```
Solutions:
- Ensure your app listens on process.env.PORT
- Set PORT=10000 in environment variables
- Check your main.ts uses the correct port configuration
```

### Build Logs

Monitor build logs in Render dashboard:
1. Go to your service
2. Click **"Logs"** tab
3. Look for build and runtime errors

### Application Logs

Check application logs for runtime issues:
```bash
# In Render shell
tail -f /opt/render/project/src/logs/app.log
```

## Monitoring and Maintenance

### Health Checks

Your application includes a health endpoint at `/health`. Render automatically monitors this.

### Scaling

Render auto-scales based on traffic. You can configure:
- **Instance Type**: Free, Starter, Standard, Pro
- **Auto-scaling**: Horizontal scaling based on CPU/memory

### Updates

With auto-deploy enabled:
1. Push changes to your connected branch
2. Render automatically rebuilds and deploys
3. Zero-downtime deployments for paid plans

### Backup Strategy

1. **Database**: Enable automated backups in PostgreSQL service
2. **Files**: Use cloud storage (AWS S3, etc.) for uploads
3. **Environment**: Keep environment variables documented

## Performance Optimization

### 1. Enable Compression
Your app already includes compression middleware.

### 2. Static File Serving
Configure CDN for static assets if needed.

### 3. Database Optimization
- Use connection pooling
- Enable query optimization
- Regular database maintenance

### 4. Caching
- Implement Redis for session storage
- Cache API responses where appropriate

## Security Checklist

- ✅ Environment variables are secure
- ✅ JWT secrets are strong and unique
- ✅ Database credentials are not exposed
- ✅ HTTPS is enabled (automatic on Render)
- ✅ Rate limiting is configured
- ✅ Input validation is implemented

## Support and Resources

- **Render Documentation**: https://render.com/docs
- **Node.js on Render**: https://render.com/docs/node-version
- **Environment Variables**: https://render.com/docs/environment-variables
- **Custom Domains**: https://render.com/docs/custom-domains

## Deployment Checklist

Before deploying, ensure:

- [ ] All environment variables are configured
- [ ] Database is set up and accessible
- [ ] Build commands are correct
- [ ] Start command is properly configured
- [ ] Health check endpoint is working
- [ ] Dependencies are properly listed
- [ ] Git repository is up to date
- [ ] Sensitive data is not committed
- [ ] API keys are valid and working

---

## Quick Start Commands

For immediate deployment:

```bash
# 1. Push your code to GitHub
git add .
git commit -m "Deploy to Render"
git push origin main

# 2. In Render dashboard:
# - Create new Web Service
# - Connect GitHub repo
# - Set environment to Node
# - Build command: npm install && npm run db:generate && npm run build
# - Start command: npm start
# - Add environment variables
# - Deploy!
```

Your Construction ERP application should now be successfully deployed on Render.com!
