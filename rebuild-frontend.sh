#!/bin/bash

# Script to rebuild frontend after pulling code
# Usage: ./rebuild-frontend.sh

# Configuration
PROJECT_DIR="/var/www/family-directory"
FRONTEND_DIR="$PROJECT_DIR/frontend"
PUBLIC_DIR="$PROJECT_DIR/public"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

set -e  # Exit on any error

echo -e "${GREEN}Rebuilding frontend...${NC}"

# Check if directories exist
if [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}Error: Frontend directory not found at $FRONTEND_DIR${NC}"
    exit 1
fi

# Step 1: Navigate to frontend and install dependencies
echo -e "${YELLOW}Step 1: Installing frontend dependencies...${NC}"
cd "$FRONTEND_DIR"
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: npm install failed.${NC}"
    exit 1
fi

# Step 2: Build frontend
echo -e "${YELLOW}Step 2: Building frontend...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Frontend build failed.${NC}"
    exit 1
fi

# Verify build output exists
if [ ! -d "$FRONTEND_DIR/dist" ] || [ -z "$(ls -A $FRONTEND_DIR/dist)" ]; then
    echo -e "${RED}Error: Build output is empty or missing.${NC}"
    exit 1
fi

echo -e "${GREEN}Build successful!${NC}"

# Step 3: Copy built files to public directory
echo -e "${YELLOW}Step 3: Copying built files to public directory...${NC}"

# Create public directory if it doesn't exist
if [ ! -d "$PUBLIC_DIR" ]; then
    echo -e "${YELLOW}Creating public directory...${NC}"
    mkdir -p "$PUBLIC_DIR"
fi

# Remove old files
cd "$PROJECT_DIR"
rm -rf "$PUBLIC_DIR"/*

# Copy new files
cp -r "$FRONTEND_DIR/dist"/* "$PUBLIC_DIR"/

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to copy files.${NC}"
    exit 1
fi

echo -e "${GREEN}Files copied successfully!${NC}"

# Step 4: Restart application
echo -e "${YELLOW}Step 4: Restarting application...${NC}"
pm2 restart family-directory --update-env

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to restart application.${NC}"
    exit 1
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Frontend rebuild completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"

