#!/bin/bash
# Deploy Family Directory to Hostinger
# Usage: ./deploy-to-hostinger.sh [hostinger-username] [hostinger-host] [app-path]

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration (update these)
HOSTINGER_USER="${1:-your-username}"
HOSTINGER_HOST="${2:-your-hostinger-host.com}"
APP_PATH="${3:-/var/www/family-directory}"

echo -e "${GREEN}🚀 Deploying Family Directory to Hostinger${NC}"
echo "=================================="
echo ""

# Step 1: Create production zip
echo -e "${YELLOW}Step 1: Creating production zip...${NC}"
node create-production-zip.js

if [ ! -f "deployment/family-directory-production.zip" ]; then
    echo -e "${RED}Error: Zip file not created!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Zip file created${NC}"
echo ""

# Step 2: Upload to server
echo -e "${YELLOW}Step 2: Uploading to Hostinger...${NC}"
echo "Uploading to: ${HOSTINGER_USER}@${HOSTINGER_HOST}:${APP_PATH}"
echo ""

scp deployment/family-directory-production.zip ${HOSTINGER_USER}@${HOSTINGER_HOST}:${APP_PATH}/

echo -e "${GREEN}✓ Upload complete${NC}"
echo ""

# Step 3: Instructions for SSH
echo -e "${YELLOW}Step 3: Connect via SSH and run these commands:${NC}"
echo ""
echo "ssh ${HOSTINGER_USER}@${HOSTINGER_HOST}"
echo "cd ${APP_PATH}"
echo "unzip -o family-directory-production.zip"
echo "cd backend"
echo "npm install --production"
echo "node migrations/run-migrations.js  # Run new migrations"
echo "pm2 restart family-directory  # Or restart your Node.js app"
echo ""

echo -e "${GREEN}✅ Deployment package ready!${NC}"



