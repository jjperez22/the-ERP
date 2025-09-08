#!/bin/bash

# Construction ERP API Server Setup Script
# This script sets up the mock API server for push notifications and data sync

set -e

echo "🏗️  Construction ERP API Server Setup"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

print_status "Node.js found: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_status "npm found: $(npm --version)"

# Check if we're in the right directory
if [ ! -f "api-server.js" ]; then
    print_error "api-server.js not found. Please run this script from the construction-erp-demo directory."
    exit 1
fi

print_status "Found API server files"

# Install dependencies if needed
print_info "Checking dependencies..."

# Check if express is installed
if ! npm list express &> /dev/null; then
    print_info "Installing required dependencies..."
    npm install express cors web-push nodemon
    print_status "Dependencies installed"
else
    print_status "Dependencies already installed"
fi

# Check syntax
print_info "Validating API server code..."
if node -c api-server.js; then
    print_status "API server code is valid"
else
    print_error "API server code has syntax errors"
    exit 1
fi

if node -c test-notification.js; then
    print_status "Test script is valid"
else
    print_error "Test script has syntax errors"
    exit 1
fi

# Create a simple start script
cat > start-api-server.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Construction ERP API Server..."
echo "Server will run on http://localhost:3001"
echo "Press Ctrl+C to stop the server"
echo ""
node api-server.js
EOF

chmod +x start-api-server.sh
print_status "Created start-api-server.sh script"

# Create a test script
cat > run-tests.sh << 'EOF'
#!/bin/bash
echo "🧪 Testing Construction ERP API Server..."
echo "Make sure the API server is running first!"
echo ""
node test-notification.js
EOF

chmod +x run-tests.sh
print_status "Created run-tests.sh script"

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "🚀 To start the API server:"
echo "   ./start-api-server.sh"
echo "   OR"
echo "   node api-server.js"
echo ""
echo "🧪 To test the API:"
echo "   ./run-tests.sh"
echo "   OR"
echo "   node test-notification.js"
echo ""
echo "📚 For documentation, see:"
echo "   API-SERVER-README.md"
echo ""
echo "🎨 The PWA (index.html) is ready to use with this API server!"
echo ""
print_info "Server will run on: http://localhost:3001"
print_info "PWA should be served from: http://localhost:8080 (or your preferred port)"
echo ""
print_warning "For production, make sure to:"
echo "  - Set proper VAPID keys"
echo "  - Configure HTTPS"
echo "  - Replace in-memory storage with a database"
echo "  - Add authentication"
echo ""
