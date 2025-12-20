#!/bin/bash

# Deployment script for Family Directory production server
# This script pulls changes from GitHub and deploys to production

# Configuration
PROJECT_DIR="/var/www/family-directory"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
PUBLIC_DIR="$PROJECT_DIR/public"
PM2_APP_NAME="family-directory"

# Function to display error recovery information
show_error_recovery() {
    echo ""
    echo -e "${RED}════════════════════════════════════════${NC}"
    echo -e "${RED}Deployment Failed - Recovery Options${NC}"
    echo -e "${RED}════════════════════════════════════════${NC}"
    echo ""
    echo -e "${YELLOW}🔄 Restore from Backup:${NC}"
    if [ -n "$BACKUP_DIR" ] && [ -d "$BACKUP_DIR" ]; then
        echo -e "   cd $PROJECT_DIR"
        echo -e "   rm -rf public/*"
        echo -e "   cp -r $BACKUP_DIR/* public/"
        echo -e "   pm2 restart $PM2_APP_NAME"
        echo ""
        echo -e "   ${YELLOW}One-liner:${NC}"
        echo -e "   ${YELLOW}cd $PROJECT_DIR && rm -rf public/* && cp -r $BACKUP_DIR/* public/ && pm2 restart $PM2_APP_NAME${NC}"
    else
        echo -e "   ${YELLOW}No backup available. Check git history to rollback.${NC}"
    fi
    echo ""
    echo -e "${YELLOW}↩️  Rollback Git Changes:${NC}"
    echo -e "   cd $BACKEND_DIR"
    echo -e "   git log --oneline -5  # Find the commit before this deployment"
    echo -e "   git reset --hard <previous-commit-hash>"
    echo -e "   cd ../frontend && npm run build"
    echo -e "   cd .. && rm -rf public/* && cp -r frontend/dist/* public/"
    echo -e "   pm2 restart $PM2_APP_NAME"
    echo ""
    echo -e "${YELLOW}📊 Check What Went Wrong:${NC}"
    echo -e "   pm2 logs $PM2_APP_NAME --lines 100"
    echo -e "   cd $BACKEND_DIR && git status"
    echo -e "   cd $FRONTEND_DIR && npm run build  # Test build manually"
    echo ""
    echo -e "${RED}════════════════════════════════════════${NC}"
}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Initialize backup directory variable (will be set during deployment)
BACKUP_DIR=""

# Trap errors to show recovery info
trap 'show_error_recovery' ERR

set -e  # Exit on any error

echo -e "${GREEN}Starting deployment...${NC}"

# Check if we're in the right directory structure
if [ ! -d "$BACKEND_DIR" ] || [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}Error: Project directories not found. Are you on the production server?${NC}"
    exit 1
fi

# Step 1: Navigate to backend and check git status
echo -e "${YELLOW}Step 1: Checking git status...${NC}"
cd "$BACKEND_DIR"

# Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}Warning: Uncommitted changes detected. They will be preserved but may cause conflicts.${NC}"
    git status --short
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Deployment cancelled.${NC}"
        exit 1
    fi
fi

# Check current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo -e "${GREEN}Current branch: $CURRENT_BRANCH${NC}"

if [ "$CURRENT_BRANCH" != "master" ]; then
    echo -e "${YELLOW}Warning: Not on master branch. Current branch: $CURRENT_BRANCH${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Deployment cancelled.${NC}"
        exit 1
    fi
fi

# Step 2: Pull latest changes
echo -e "${YELLOW}Step 2: Pulling latest changes from GitHub...${NC}"
git pull origin master

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Git pull failed. Deployment aborted.${NC}"
    exit 1
fi

# Show what changed
echo -e "${GREEN}Recent commits:${NC}"
git log --oneline -5

# Step 3: Navigate to frontend and install dependencies
echo -e "${YELLOW}Step 3: Installing frontend dependencies...${NC}"
cd "$FRONTEND_DIR"
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: npm install failed. Deployment aborted.${NC}"
    exit 1
fi

# Step 4: Build frontend
echo -e "${YELLOW}Step 4: Building frontend...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Frontend build failed. Deployment aborted.${NC}"
    exit 1
fi

# Verify build output exists
if [ ! -d "$FRONTEND_DIR/dist" ] || [ -z "$(ls -A $FRONTEND_DIR/dist)" ]; then
    echo -e "${RED}Error: Build output is empty or missing. Deployment aborted.${NC}"
    exit 1
fi

echo -e "${GREEN}Build successful!${NC}"

# Step 5: Backup current public directory (optional safety measure)
echo -e "${YELLOW}Step 5: Backing up current public directory...${NC}"
BACKUP_DIR="${PUBLIC_DIR}.backup.$(date +%Y%m%d_%H%M%S)"
if [ -d "$PUBLIC_DIR" ] && [ "$(ls -A $PUBLIC_DIR 2>/dev/null)" ]; then
    cp -r "$PUBLIC_DIR" "$BACKUP_DIR"
    echo -e "${GREEN}Backup created: $BACKUP_DIR${NC}"
    # Keep only last 3 backups
    ls -td ${PUBLIC_DIR}.backup.* 2>/dev/null | tail -n +4 | xargs rm -rf 2>/dev/null || true
    echo -e "${GREEN}Backup location saved for recovery instructions.${NC}"
else
    echo -e "${YELLOW}No existing public directory to backup.${NC}"
    BACKUP_DIR=""  # Clear backup dir if none was created
fi

# Step 6: Remove old frontend files
echo -e "${YELLOW}Step 6: Removing old frontend files...${NC}"
cd "$PROJECT_DIR"
rm -rf "$PUBLIC_DIR"/*

# Step 7: Copy new built files
echo -e "${YELLOW}Step 7: Copying new frontend files...${NC}"
cp -r "$FRONTEND_DIR/dist"/* "$PUBLIC_DIR"/

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to copy files. Attempting to restore backup...${NC}"
    if [ -d "$BACKUP_DIR" ]; then
        cp -r "$BACKUP_DIR"/* "$PUBLIC_DIR"/ 2>/dev/null || true
    fi
    exit 1
fi

echo -e "${GREEN}Files copied successfully!${NC}"

# Step 8: Restart application
echo -e "${YELLOW}Step 8: Restarting application...${NC}"
pm2 restart "$PM2_APP_NAME"

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to restart application.${NC}"
    exit 1
fi

# Step 9: Verify application is running
echo -e "${YELLOW}Step 9: Verifying application status...${NC}"
sleep 2  # Give PM2 a moment to restart
pm2 status

# Check if app is online
APP_STATUS=$(pm2 jlist | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ "$APP_STATUS" != "online" ]; then
    echo -e "${RED}Warning: Application status is: $APP_STATUS${NC}"
    echo -e "${YELLOW}Check logs with: pm2 logs $PM2_APP_NAME${NC}"
else
    echo -e "${GREEN}Application is online!${NC}"
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}════════════════════════════════════════${NC}"
echo -e "${YELLOW}Useful Information & Recovery Options${NC}"
echo -e "${YELLOW}════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}📦 Backup Location:${NC}"
if [ -d "$BACKUP_DIR" ]; then
    echo -e "   $BACKUP_DIR"
    echo -e "   ${YELLOW}(Backups are kept for the last 3 deployments)${NC}"
else
    echo -e "   ${YELLOW}No backup was created (first deployment or public/ was empty)${NC}"
fi
echo ""
echo -e "${GREEN}🔄 How to Restore from Backup:${NC}"
if [ -d "$BACKUP_DIR" ]; then
    echo -e "   1. cd $PROJECT_DIR"
    echo -e "   2. rm -rf public/*"
    echo -e "   3. cp -r $BACKUP_DIR/* public/"
    echo -e "   4. pm2 restart $PM2_APP_NAME"
    echo ""
    echo -e "   ${YELLOW}Or use this one-liner:${NC}"
    echo -e "   ${YELLOW}cd $PROJECT_DIR && rm -rf public/* && cp -r $BACKUP_DIR/* public/ && pm2 restart $PM2_APP_NAME${NC}"
else
    echo -e "   ${YELLOW}No backup available to restore from.${NC}"
fi
echo ""
echo -e "${GREEN}↩️  How to Undo Git Changes (Rollback to Previous Commit):${NC}"
echo -e "   1. cd $BACKEND_DIR"
echo -e "   2. git log --oneline -5  # View recent commits"
echo -e "   3. git reset --hard HEAD~1  # Go back one commit"
echo -e "   4. cd ../frontend && npm run build"
echo -e "   5. cd .. && rm -rf public/* && cp -r frontend/dist/* public/"
echo -e "   6. pm2 restart $PM2_APP_NAME"
echo ""
echo -e "${GREEN}📋 View Recent Commits:${NC}"
echo -e "   cd $BACKEND_DIR && git log --oneline -10"
echo ""
echo -e "${GREEN}📊 Check Application Status:${NC}"
echo -e "   pm2 status"
echo -e "   pm2 logs $PM2_APP_NAME --lines 50"
echo ""
echo -e "${GREEN}🔍 Verify Deployment:${NC}"
echo -e "   - Check application is responding"
echo -e "   - Test new features in browser"
echo -e "   - Review PM2 logs for any errors"
echo ""
echo -e "${GREEN}📝 Current Deployment Info:${NC}"
echo -e "   Branch: $(cd $BACKEND_DIR && git rev-parse --abbrev-ref HEAD)"
echo -e "   Commit: $(cd $BACKEND_DIR && git rev-parse --short HEAD)"
echo -e "   Date: $(date)"
echo ""
echo -e "${YELLOW}════════════════════════════════════════${NC}"

