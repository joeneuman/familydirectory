# Pull Branch to Production for Testing

This guide shows how to pull a specific branch to your production server to test it before merging to master.

## Step 1: SSH into Your Production Server

```bash
ssh root@24.144.81.8
```

## Step 2: Navigate to Your Application Directory

```bash
cd /var/www/family-directory
```

## Step 3: Check Current Branch and Status

```bash
# Check what branch you're currently on
git branch

# Check if you have any uncommitted changes
git status
```

## Step 4: Fetch Latest Changes from GitHub

```bash
# Fetch all branches from remote
git fetch origin

# See all available branches
git branch -a
```

## Step 5: Checkout the error-handling Branch

```bash
# Switch to the error-handling branch
git checkout error-handling

# If the branch doesn't exist locally yet, create it and track the remote
git checkout -b error-handling origin/error-handling
```

## Step 6: Pull Latest Changes

```bash
# Make sure you're on the error-handling branch
git checkout error-handling

# Pull the latest changes
git pull origin error-handling
```

## Step 7: Rebuild Frontend (REQUIRED)

**After pulling any code changes, you MUST rebuild the frontend:**

```bash
# Option 1: Use the rebuild script (recommended)
cd /var/www/family-directory
./rebuild-frontend.sh

# Option 2: Manual rebuild
cd /var/www/family-directory/frontend
npm install
npm run build
cd ..
rm -rf public/*
cp -r frontend/dist/* public/
pm2 restart family-directory --update-env
```

## Step 8: Install/Update Backend Dependencies

```bash
# Backend dependencies
cd /var/www/family-directory/backend
npm install --production
```

## Step 9: Run Database Migrations (if any)

```bash
cd /var/www/family-directory/backend
node migrations/run-migrations.js
```

## Step 10: Verify It's Working

**Note:** The application is already restarted by the rebuild script, so you can skip the manual restart step.

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs family-directory --lines 50

# Test the application
curl http://localhost:3001/api/health
```

## To Switch Back to Master

If you need to switch back to master:

```bash
cd /var/www/family-directory
git checkout master
git pull origin master
./rebuild-frontend.sh  # Rebuild frontend with master branch code
```

## Important Notes

- **Backup first**: Always backup your database before testing new code
- **Test thoroughly**: Test all features before merging
- **Environment variables**: Make sure your `.env` file has all required variables for new features
- **Dependencies**: New features might require new npm packages

## Quick One-Liner (if you're already on the server)

```bash
cd /var/www/family-directory && git fetch origin && git checkout error-handling && git pull origin error-handling && ./rebuild-frontend.sh
```

**Or if you prefer manual steps:**

```bash
cd /var/www/family-directory && git fetch origin && git checkout error-handling && git pull origin error-handling && cd frontend && npm install && npm run build && cd .. && rm -rf public/* && cp -r frontend/dist/* public/ && cd backend && npm install --production && pm2 restart family-directory --update-env
```

