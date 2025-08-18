# 🚀 AI-Powered Construction ERP - Complete Deployment Guide

## 📋 Prerequisites Installation

### Step 1: Install Homebrew (Package Manager for macOS)

```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Add Homebrew to your PATH (follow the instructions shown after installation)
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

### Step 2: Install Node.js and npm

```bash
# Install Node.js (version 18 or higher)
brew install node

# Verify installation
node --version  # Should show v18.x.x or higher
npm --version   # Should show 9.x.x or higher
```

### Step 3: Install Docker (Recommended for Production)

```bash
# Install Docker Desktop
brew install --cask docker

# Or download directly from: https://docs.docker.com/desktop/install/mac/

# Start Docker Desktop application
open -a Docker

# Verify Docker installation
docker --version
docker-compose --version
```

## 🎯 Deployment Options

### Option 1: One-Click Deployment Script (Recommended)

```bash
# Navigate to your project directory
cd /Users/javierperez/Downloads/construction-erp-demo

# Run the automated deployment script
./deploy.sh
```

The script will:
- ✅ Check all prerequisites
- ✅ Set up environment variables
- ✅ Build and deploy the application
- ✅ Start all services (Database, Redis, Application)
- ✅ Provide access URLs

### Option 2: Manual Docker Deployment

```bash
# 1. Set up environment variables
cp .env.example .env

# 2. Edit .env file with your settings
nano .env
# Add your OpenAI API key and other configuration

# 3. Build and start services
docker-compose up -d

# 4. Check status
docker-compose ps
```

### Option 3: Local Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your configuration

# 3. Build the application
npm run build

# 4. Start development server
npm run dev
```

## 🔧 Environment Configuration

### Required Environment Variables

Create a `.env` file with the following:

```env
# === CRITICAL: AI Configuration ===
OPENAI_API_KEY="sk-your-actual-openai-api-key"

# === Security ===
JWT_SECRET="your-super-secure-jwt-secret-minimum-32-characters"

# === Database ===
DATABASE_URL="postgresql://postgres:constructionerp2024@localhost:5432/construction_erp"

# === Application ===
PORT=3000
NODE_ENV=development

# === Redis (for real-time features) ===
REDIS_URL="redis://localhost:6379"
```

### 🔑 Getting Your OpenAI API Key

1. Visit: https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)
5. Add it to your `.env` file

### 🔐 Generating a Secure JWT Secret

```bash
# Generate a secure random string
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 🚀 Quick Start Commands

### For Docker Deployment:
```bash
# Clone and deploy in one go
git clone <your-repo-url> construction-erp
cd construction-erp
./deploy.sh
```

### For Development:
```bash
# Install and start development server
npm install
npm run dev
```

## 🌐 Access Your ERP System

Once deployed, access your system at:

- **🏠 Main Dashboard**: http://localhost:3000
- **📊 Health Check**: http://localhost:3000/health  
- **🧠 AI Insights**: http://localhost:3000/api/ai/comprehensive-insights
- **🔧 API Documentation**: http://localhost:3000/api

## 📊 Service Architecture

Your deployment includes:

```
┌─────────────────────────────────────────┐
│         🏗️ Construction ERP             │
├─────────────────────────────────────────┤
│  🌐 Web Application (Port 3000)        │
│  ├── 🧠 AI Orchestrator                │
│  ├── 📊 Real-time Dashboard            │
│  ├── 🔄 Automation Engine              │
│  └── 🏗️ Construction AI                │
├─────────────────────────────────────────┤
│  🗄️ PostgreSQL Database (Port 5432)    │
│  └── All business data                 │
├─────────────────────────────────────────┤  
│  ⚡ Redis Cache (Port 6379)            │
│  └── Real-time data & sessions        │
└─────────────────────────────────────────┘
```

## 🛠️ Troubleshooting

### Common Issues and Solutions:

#### Issue: "Command not found: node"
**Solution:**
```bash
# Install Node.js
brew install node
# Or visit: https://nodejs.org/
```

#### Issue: "Docker not found"
**Solution:**
```bash
# Install Docker
brew install --cask docker
# Or visit: https://docs.docker.com/desktop/install/mac/
```

#### Issue: "OpenAI API Error"
**Solution:**
- Check your API key in `.env`
- Ensure you have credits in your OpenAI account
- Verify the key starts with `sk-`

#### Issue: "Database Connection Error"
**Solution:**
```bash
# Restart database service
docker-compose restart db

# Check database logs
docker-compose logs db
```

#### Issue: "Port 3000 already in use"
**Solution:**
```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or change PORT in .env file
PORT=3001
```

## 🔍 Monitoring and Logs

### View Application Logs:
```bash
# Docker deployment
docker-compose logs app -f

# Development mode
npm run dev  # Logs appear in terminal
```

### Check Service Health:
```bash
# Health check endpoint
curl http://localhost:3000/health

# Service status
docker-compose ps
```

### Database Access:
```bash
# Connect to database
docker-compose exec db psql -U postgres -d construction_erp

# View tables
\dt
```

## 🚀 Production Deployment

### For Production Environment:

1. **Set Production Environment**:
```bash
NODE_ENV=production
```

2. **Use Secure Secrets**:
```bash
JWT_SECRET=$(openssl rand -base64 32)
```

3. **Configure SSL/HTTPS**:
```bash
# Add SSL certificates to nginx.conf
# Configure domain and certificates
```

4. **Set up Monitoring**:
```bash
# Add logging and monitoring solutions
# Configure alerts and backups
```

## 🎉 Success! Your ERP is Running

Once successfully deployed, you'll see:

```
🎉 AI-Powered Construction ERP deployed successfully!

🌐 Access your ERP system at:
   👉 http://localhost:3000

📊 Service Status:
   ✅ Application: Running
   ✅ Database: Healthy  
   ✅ Redis: Connected
   ✅ AI Services: Active

📈 Health Check:
   👉 http://localhost:3000/health

🧠 AI Insights:
   👉 http://localhost:3000/api/ai/comprehensive-insights

🚀 Your revolutionary Construction ERP is now running!
```

## 📞 Support

If you encounter any issues:

1. **Check the logs**: `docker-compose logs`
2. **Verify environment variables**: Review your `.env` file
3. **Check system requirements**: Node.js ≥18, Docker ≥20
4. **Review this guide**: Most issues are covered above

---

**🏆 Congratulations!** 

You now have the most advanced AI-powered Construction ERP system running on your machine. This revolutionary platform will transform how construction materials businesses operate with intelligent automation, real-time insights, and predictive analytics.

**Built with ❤️ for the construction industry**
