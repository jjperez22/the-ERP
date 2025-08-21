#!/usr/bin/env node

// start-production.js - Production startup script with database migration
const { execSync } = require('child_process');
const path = require('path');

async function startProduction() {
  console.log('🚀 Starting Construction ERP in production mode...');
  
  try {
    // 1. Generate Prisma client
    console.log('📦 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // 2. Run database migrations (if DATABASE_URL is available)
    if (process.env.DATABASE_URL) {
      console.log('🗄️  Running database migrations...');
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      console.log('✅ Database migrations completed');
    } else {
      console.log('⚠️  DATABASE_URL not found, skipping migrations');
    }
    
    // 3. Start the application
    console.log('🌟 Starting application server...');
    require('./dist/main.js');
    
  } catch (error) {
    console.error('❌ Failed to start application:', error.message);
    
    // Try to start without migrations as fallback
    console.log('🔄 Attempting fallback startup without migrations...');
    try {
      execSync('npx prisma generate', { stdio: 'inherit' });
      require('./dist/main.js');
    } catch (fallbackError) {
      console.error('💥 Fallback startup failed:', fallbackError.message);
      process.exit(1);
    }
  }
}

startProduction();
