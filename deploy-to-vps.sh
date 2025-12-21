#!/bin/bash
# Family Directory VPS Deployment Script
# Run this on your VPS server after uploading files

set -e  # Exit on error

echo "🚀 Family Directory VPS Deployment"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}Warning: Not running as root. Some commands may need sudo.${NC}"
fi

# Get current directory
APP_DIR=$(pwd)
echo -e "${GREEN}Application directory: ${APP_DIR}${NC}"
echo ""

# Step 1: Check Node.js
echo "📦 Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js not found! Installing Node.js 20.x...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
else
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Node.js found: ${NODE_VERSION}${NC}"
fi

# Step 2: Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm not found!${NC}"
    exit 1
else
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓ npm found: ${NPM_VERSION}${NC}"
fi

# Step 3: Check PostgreSQL client
echo ""
echo "📦 Checking PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}PostgreSQL client not found. You may need to install it or use Hostinger's database tool.${NC}"
else
    echo -e "${GREEN}✓ PostgreSQL client found${NC}"
fi

# Step 4: Install dependencies
echo ""
echo "📦 Installing Node.js dependencies..."
if [ -f "package.json" ]; then
    npm install --production
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${RED}package.json not found! Are you in the correct directory?${NC}"
    exit 1
fi

# Step 5: Check for .env file
echo ""
echo "📝 Checking environment configuration..."
if [ ! -f ".env" ]; then
    if [ -f "env.example" ]; then
        echo -e "${YELLOW}.env file not found. Creating from env.example...${NC}"
        cp env.example .env
        echo -e "${YELLOW}⚠️  Please edit .env file with your production settings!${NC}"
        echo -e "${YELLOW}   Use: nano .env${NC}"
    else
        echo -e "${RED}No .env or env.example found!${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi

# Step 6: Check database connection (if .env exists)
if [ -f ".env" ]; then
    echo ""
    echo "🔌 Testing database connection..."
    # Source .env to get DB variables
    export $(grep -v '^#' .env | xargs)
    
    if command -v psql &> /dev/null && [ ! -z "$DB_HOST" ]; then
        if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT 1;" &> /dev/null; then
            echo -e "${GREEN}✓ Database connection successful${NC}"
        else
            echo -e "${YELLOW}⚠️  Could not connect to database. Please check your .env settings.${NC}"
        fi
    fi
fi

# Step 7: Run migrations
echo ""
echo "🗄️  Running database migrations..."
if [ -d "migrations" ]; then
    node migrations/run-migrations.js
    echo -e "${GREEN}✓ Migrations completed${NC}"
else
    echo -e "${YELLOW}⚠️  Migrations directory not found. Skipping...${NC}"
fi

# Step 8: Check PM2 (process manager)
echo ""
echo "🔄 Checking PM2 (process manager)..."
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}PM2 not found. Installing PM2...${NC}"
    npm install -g pm2
    echo -e "${GREEN}✓ PM2 installed${NC}"
else
    echo -e "${GREEN}✓ PM2 found${NC}"
fi

# Step 9: Create PM2 ecosystem file
echo ""
echo "📝 Creating PM2 configuration..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'family-directory',
    script: 'src/server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
}
EOF
echo -e "${GREEN}✓ PM2 config created${NC}"

# Step 10: Create logs directory
mkdir -p logs
echo -e "${GREEN}✓ Logs directory created${NC}"

# Summary
echo ""
echo "=================================="
echo -e "${GREEN}✅ Deployment setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your production settings:"
echo "   nano .env"
echo ""
echo "2. Start the application with PM2:"
echo "   pm2 start ecosystem.config.js"
echo ""
echo "3. Save PM2 configuration:"
echo "   pm2 save"
echo ""
echo "4. Set PM2 to start on boot:"
echo "   pm2 startup"
echo "   (Follow the instructions it provides)"
echo ""
echo "5. Check application status:"
echo "   pm2 status"
echo "   pm2 logs family-directory"
echo ""




