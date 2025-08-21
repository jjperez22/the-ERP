#!/bin/bash

# ================================
# Construction ERP - Render.com Deployment Script
# ================================

set -e  # Exit on any error

echo "🚀 Starting Render.com deployment process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not in a Git repository. Please initialize Git first:"
    echo "  git init"
    echo "  git add ."
    echo "  git commit -m 'Initial commit'"
    echo "  git remote add origin <your-github-repo-url>"
    echo "  git push -u origin main"
    exit 1
fi

# Check if we have uncommitted changes
if ! git diff-index --quiet HEAD --; then
    print_warning "You have uncommitted changes."
    echo "Would you like to commit them? (y/n)"
    read -r commit_changes
    
    if [ "$commit_changes" = "y" ] || [ "$commit_changes" = "Y" ]; then
        git add .
        echo "Enter commit message:"
        read -r commit_message
        git commit -m "$commit_message"
        print_success "Changes committed."
    else
        print_warning "Proceeding with uncommitted changes..."
    fi
fi

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Are you in the project root?"
    exit 1
fi

# Verify essential files exist
print_status "Checking essential files..."

files_to_check=("main.ts" "src/" "prisma/schema.prisma")
missing_files=()

for file in "${files_to_check[@]}"; do
    if [ ! -e "$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -gt 0 ]; then
    print_error "Missing essential files:"
    for file in "${missing_files[@]}"; do
        echo "  - $file"
    done
    exit 1
fi

print_success "All essential files found."

# Check environment variables template
if [ ! -f "render.env.template" ]; then
    print_warning "render.env.template not found. Creating it..."
    cat > render.env.template << 'EOF'
# Essential Variables
NODE_ENV=production
PORT=10000
DATABASE_URL=your-database-url
JWT_SECRET=your-jwt-secret
OPENAI_API_KEY=your-openai-key

# Optional Variables
REDIS_URL=your-redis-url
LOG_LEVEL=info
ENABLE_AI_FEATURES=true
EOF
    print_success "Created render.env.template"
fi

# Push to GitHub
print_status "Pushing to GitHub..."
current_branch=$(git branch --show-current)

if [ -z "$current_branch" ]; then
    print_error "Not on any branch. Please create and switch to a branch first."
    exit 1
fi

# Check if remote exists
if ! git remote -v | grep -q origin; then
    print_error "No 'origin' remote found. Please add your GitHub repository:"
    echo "  git remote add origin <your-github-repo-url>"
    exit 1
fi

git push origin "$current_branch"
print_success "Code pushed to GitHub ($current_branch branch)."

# Display deployment instructions
echo ""
print_success "🎉 Ready for Render.com deployment!"
echo ""
echo "Next steps:"
echo "1. Go to https://render.com and log in"
echo "2. Click 'New +' → 'Web Service'"
echo "3. Connect your GitHub repository"
echo "4. Configure with these settings:"
echo ""
echo "   ${BLUE}Basic Settings:${NC}"
echo "   - Name: construction-erp-app"
echo "   - Environment: Node"
echo "   - Branch: $current_branch"
echo ""
echo "   ${BLUE}Build & Deploy:${NC}"
echo "   - Build Command: npm install && npm run db:generate && npm run build"
echo "   - Start Command: npm start"
echo ""
echo "   ${BLUE}Advanced:${NC}"
echo "   - Node Version: 18"
echo "   - Auto-Deploy: Yes"
echo ""
echo "5. Add environment variables from render.env.template"
echo "6. Create a PostgreSQL database in Render"
echo "7. Deploy!"
echo ""
print_warning "Don't forget to:"
echo "   - Set up your database (PostgreSQL) in Render"
echo "   - Configure all environment variables"
echo "   - Get your OpenAI API key"
echo "   - Run database migrations after deployment"
echo ""
print_success "Deployment guide available in RENDER_DEPLOYMENT_GUIDE.md"
