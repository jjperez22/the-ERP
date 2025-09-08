#!/bin/bash

# Setup script for Construction ERP Demo
# This script sets up the Node.js environment using NVM

echo "🚀 Setting up Construction ERP Demo environment..."

# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Use Node.js 18
nvm use 18

echo "✅ Node.js environment ready!"
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo ""
echo "Available scripts:"
echo "  npm run dev          - Start development server"
echo "  npm run build        - Build for production"
echo "  npm start            - Start production server"
echo "  npm test             - Run tests"
echo "  npm run lint         - Run linting"
echo "  npm run format       - Format code"
echo ""
echo "🎉 You're ready to start developing!"
