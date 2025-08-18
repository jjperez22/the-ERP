#!/bin/bash

# ==============================================
# AI-Powered Construction ERP Deployment Script
# ==============================================

set -e

echo "🚀 Starting AI-Powered Construction ERP Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    print_status "Checking Docker installation..."
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        print_status "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose."
        print_status "Visit: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed ✅"
}

# Check if .env file exists
check_env_file() {
    print_status "Checking environment configuration..."
    
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Creating from template..."
        
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_success "Created .env file from template"
            print_warning "⚠️  IMPORTANT: Please edit .env file with your actual configuration!"
            print_status "Required settings:"
            echo "  - OPENAI_API_KEY: Your OpenAI API key"
            echo "  - JWT_SECRET: A secure random string (min 32 characters)"
            echo ""
            echo "Example:"
            echo "  export OPENAI_API_KEY='sk-your-openai-key-here'"
            echo "  export JWT_SECRET='your-super-secure-jwt-secret-key-minimum-32-characters'"
            echo ""
            read -p "Press Enter after you've configured the .env file..."
        else
            print_error ".env.example file not found!"
            exit 1
        fi
    else
        print_success ".env file exists ✅"
    fi
}

# Validate environment variables
validate_env() {
    print_status "Validating environment variables..."
    
    source .env 2>/dev/null || true
    
    if [ -z "$OPENAI_API_KEY" ] || [ "$OPENAI_API_KEY" = "your-openai-api-key-here" ]; then
        print_error "OPENAI_API_KEY is not set properly in .env file"
        print_status "Get your API key from: https://platform.openai.com/api-keys"
        exit 1
    fi
    
    if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "your-super-secure-jwt-secret-key-minimum-32-characters" ]; then
        print_error "JWT_SECRET is not set properly in .env file"
        print_status "Generate a secure secret with: openssl rand -base64 32"
        exit 1
    fi
    
    print_success "Environment variables are valid ✅"
}

# Build and deploy
deploy_with_docker() {
    print_status "Building and deploying AI-Powered Construction ERP..."
    
    # Export environment variables for docker-compose
    set -a
    source .env
    set +a
    
    # Stop any existing containers
    print_status "Stopping any existing containers..."
    docker-compose down 2>/dev/null || true
    
    # Build and start services
    print_status "Building Docker images..."
    docker-compose build
    
    print_status "Starting services..."
    docker-compose up -d
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 10
    
    # Check if services are healthy
    if docker-compose ps | grep -q "healthy\|Up"; then
        print_success "🎉 AI-Powered Construction ERP deployed successfully!"
        echo ""
        echo "🌐 Access your ERP system at:"
        echo "   👉 http://localhost:3000"
        echo ""
        echo "📊 Service Status:"
        docker-compose ps
        echo ""
        echo "📈 Health Check:"
        echo "   👉 http://localhost:3000/health"
        echo ""
        echo "🧠 AI Insights:"
        echo "   👉 http://localhost:3000/api/ai/comprehensive-insights"
        echo ""
        print_success "🚀 Your revolutionary Construction ERP is now running!"
    else
        print_error "Deployment failed. Checking logs..."
        docker-compose logs
        exit 1
    fi
}

# Deploy without Docker (local development)
deploy_local() {
    print_status "Deploying locally for development..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js >= 18.0.0"
        print_status "Visit: https://nodejs.org/"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed."
        exit 1
    fi
    
    print_status "Installing dependencies..."
    npm install
    
    print_status "Building application..."
    npx tsc
    
    print_status "Starting development server..."
    npm run dev &
    
    print_success "🎉 Local development server started!"
    echo "👉 http://localhost:3000"
}

# Main deployment logic
main() {
    echo "🏗️ AI-Powered Construction ERP Deployment"
    echo "=========================================="
    echo ""
    
    # Ask for deployment type
    echo "Choose deployment method:"
    echo "1) Docker (Production-ready with all services)"
    echo "2) Local Development (Node.js only)"
    echo ""
    read -p "Enter your choice (1 or 2): " deployment_choice
    
    case $deployment_choice in
        1)
            print_status "Selected: Docker deployment"
            check_docker
            check_env_file
            validate_env
            deploy_with_docker
            ;;
        2)
            print_status "Selected: Local development"
            check_env_file
            validate_env
            deploy_local
            ;;
        *)
            print_error "Invalid choice. Please enter 1 or 2."
            exit 1
            ;;
    esac
}

# Run main function
main

echo ""
print_success "🎊 Deployment completed successfully!"
print_status "Visit the README.md for more information and usage instructions."
echo ""
echo "Built with ❤️  for the construction industry"
echo "Making construction materials management intelligent, automated, and beautiful."
