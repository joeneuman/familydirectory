# Production Environment Variables Checklist

When deploying to production, ensure your `.env` file in the `backend/` directory has these values set correctly.

## Required Environment Variables for Production

**In `/var/www/family-directory/backend/.env`:**

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=family_directory
DB_USER=family_user
DB_PASSWORD=your_production_password

# Server Configuration
PORT=3001
NODE_ENV=production

# JWT Secret (must match what's in production)
JWT_SECRET=your-production-jwt-secret

# Frontend URL (CRITICAL - must be production domain)
FRONTEND_URL=https://neumanfam.com

# Base URL (CRITICAL - must be production domain for magic links)
BASE_URL=https://neumanfam.com

# Email Configuration
EMAIL_SERVICE=smtp
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=587
EMAIL_USER=your-email@neumanfam.com
EMAIL_PASSWORD=your-email-password
EMAIL_FROM=noreply@neumanfam.com

# Magic Link Expiry
MAGIC_LINK_EXPIRY_MINUTES=15
```

## Quick Check Script

**On your production server, run this to verify:**

```bash
cd /var/www/family-directory/backend

# Check if .env exists
if [ -f .env ]; then
  echo "✅ .env file exists"
  
  # Check critical variables
  if grep -q "FRONTEND_URL=https://neumanfam.com" .env; then
    echo "✅ FRONTEND_URL is set correctly"
  else
    echo "❌ FRONTEND_URL is NOT set to https://neumanfam.com"
  fi
  
  if grep -q "BASE_URL=https://neumanfam.com" .env; then
    echo "✅ BASE_URL is set correctly"
  else
    echo "❌ BASE_URL is NOT set to https://neumanfam.com"
  fi
  
  if grep -q "NODE_ENV=production" .env; then
    echo "✅ NODE_ENV is set to production"
  else
    echo "❌ NODE_ENV is NOT set to production"
  fi
else
  echo "❌ .env file does not exist!"
fi
```

## When Switching Branches

**Before switching to a new branch on production:**

1. **Check current .env values:**
   ```bash
   cd /var/www/family-directory/backend
   cat .env | grep -E "FRONTEND_URL|BASE_URL|NODE_ENV"
   ```

2. **After switching branches, verify .env is still correct:**
   ```bash
   # The .env file should persist across branch switches
   # But verify it wasn't accidentally overwritten
   cat .env | grep -E "FRONTEND_URL|BASE_URL"
   ```

3. **Restart the server:**
   ```bash
   pm2 restart family-directory
   ```

## Common Issues

### Issue: Magic links point to localhost
**Cause:** `BASE_URL` or `FRONTEND_URL` not set correctly  
**Fix:** Update `.env` file with correct production URLs

### Issue: CORS errors
**Cause:** `FRONTEND_URL` doesn't match actual domain  
**Fix:** Set `FRONTEND_URL=https://neumanfam.com` in `.env`

### Issue: Expired link redirects to localhost
**Cause:** Frontend hardcoded URL (should be fixed in code, but check)  
**Fix:** Code now uses `window.location.origin` automatically

## Automated Fix Script

**To quickly fix environment variables on production:**

```bash
cd /var/www/family-directory/backend

# Backup current .env
cp .env .env.backup

# Update critical URLs (if they're wrong)
sed -i 's|FRONTEND_URL=.*|FRONTEND_URL=https://neumanfam.com|' .env
sed -i 's|BASE_URL=.*|BASE_URL=https://neumanfam.com|' .env
sed -i 's|NODE_ENV=.*|NODE_ENV=production|' .env

# Restart
pm2 restart family-directory
```

## Best Practice

**Always verify .env after:**
- Switching branches
- Pulling new code
- Server restarts
- After any deployment

**The .env file should NEVER be committed to git** - it's in `.gitignore` for a reason!

