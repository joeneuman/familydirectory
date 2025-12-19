# Production Deployment Guide - Hostinger

This guide will help you deploy the Family Directory application to Hostinger.

## Prerequisites

1. Hostinger hosting account with:
   - Node.js support
   - PostgreSQL database
   - Domain name configured

2. Access to:
   - Hostinger control panel (hPanel)
   - File Manager or FTP/SFTP
   - Database management (phpMyAdmin or similar)

## Step 1: Database Setup

### Create PostgreSQL Database on Hostinger

1. Log into Hostinger hPanel
2. Go to **Databases** → **PostgreSQL Databases**
3. Create a new database:
   - Database name: `family_directory` (or your preferred name)
   - Username: (auto-generated or custom)
   - Password: (save this securely)
   - Host: (usually `localhost` or provided by Hostinger)
   - Port: (usually `5432`)

4. **Save these credentials** - you'll need them for the `.env` file

### Run Database Migrations

You'll need to run the migrations on the production database. Options:

**Option A: Run migrations via SSH/Node.js**
```bash
cd backend
node migrations/run-migrations.js
```

**Option B: Import SQL directly**
- Export your local database schema
- Import via Hostinger's database management tool

## Step 2: Environment Configuration

### Backend Environment Variables

Create a `.env` file in the `backend` directory with:

```env
# Database
DB_HOST=your-database-host
DB_PORT=5432
DB_NAME=your-database-name
DB_USER=your-database-user
DB_PASSWORD=your-database-password

# Server
PORT=3001
NODE_ENV=production

# JWT Secret (generate a strong random string)
JWT_SECRET=your-very-long-random-secret-key-here

# Frontend URL (your domain)
FRONTEND_URL=https://yourdomain.com

# Base URL (for magic links)
BASE_URL=https://yourdomain.com

# Email Configuration (if using SMTP)
EMAIL_SERVICE=smtp
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=587
EMAIL_USER=your-email@yourdomain.com
EMAIL_PASSWORD=your-email-password
EMAIL_FROM=noreply@yourdomain.com

# Magic Link Expiry (optional, defaults to 15 minutes)
MAGIC_LINK_EXPIRY_MINUTES=15
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Frontend Environment Variables

The frontend doesn't need a `.env` file - the API URL is determined automatically based on the hostname.

## Step 3: Build Frontend

Build the production frontend:

```bash
cd frontend
npm install
npm run build
```

This creates a `dist` folder with production-ready files.

## Step 4: Upload Files to Hostinger

### File Structure on Server

```
/home/username/public_html/
├── api/                    # Backend files
│   ├── src/
│   ├── migrations/
│   ├── package.json
│   └── .env
└── public/                 # Frontend build files
    ├── index.html
    ├── assets/
    └── ...
```

### Upload Process

1. **Backend Files:**
   - Upload entire `backend` folder to `/home/username/public_html/api/`
   - Upload `.env` file (keep it secure, don't commit to git)

2. **Frontend Files:**
   - Upload contents of `frontend/dist/` to `/home/username/public_html/`

## Step 5: Install Dependencies

Via SSH or Hostinger's Node.js manager:

```bash
cd /home/username/public_html/api
npm install --production
```

## Step 6: Configure Server

### Option A: Using Hostinger's Node.js Manager

1. In hPanel, go to **Node.js**
2. Create a new application:
   - Application root: `/home/username/public_html/api`
   - Application URL: `yourdomain.com/api` (or subdomain)
   - Application startup file: `src/server.js`
   - Node version: 18.x or 20.x

### Option B: Using PM2 (if SSH access available)

```bash
cd /home/username/public_html/api
npm install -g pm2
pm2 start src/server.js --name family-directory-api
pm2 save
pm2 startup
```

### Option C: Using .htaccess (if using Apache)

Create `.htaccess` in the root:

```apache
RewriteEngine On
RewriteCond %{REQUEST_URI} ^/api
RewriteRule ^api/(.*)$ http://localhost:3001/api/$1 [P,L]

RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [L]
```

## Step 7: Configure Domain/Subdomain

### For API (Backend)

- Point subdomain `api.yourdomain.com` to the Node.js application
- Or use path-based routing: `yourdomain.com/api`

### For Frontend

- Point main domain `yourdomain.com` to the `public_html` folder
- Ensure `index.html` is in the root

## Step 8: Update Frontend API Configuration

The frontend automatically detects the API URL based on the hostname. If you're using a subdomain for the API, you may need to update `frontend/src/utils/api.js`.

## Step 9: Test Production

1. Visit `https://yourdomain.com`
2. Test login with magic link
3. Verify all features work
4. Check browser console for errors

## Step 10: Import Data

### Option A: Using CSV Import Script

```bash
cd /home/username/public_html/api
node scripts/import-csv.js your-data.csv
```

### Option B: Using Database Dump

Export from local database and import to production via Hostinger's database tool.

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify database credentials in `.env`
   - Check if database host allows connections from your server IP
   - Ensure database user has proper permissions

2. **API Not Accessible**
   - Check Node.js application is running
   - Verify port configuration
   - Check firewall settings

3. **Magic Links Not Working**
   - Verify `BASE_URL` and `FRONTEND_URL` in `.env`
   - Check email configuration if using SMTP
   - Check CORS settings in `backend/src/server.js`

4. **Frontend Can't Connect to API**
   - Verify API URL is correct
   - Check CORS configuration
   - Ensure API is accessible from frontend domain

## Security Checklist

- [ ] `.env` file is not in git repository
- [ ] JWT_SECRET is strong and unique
- [ ] Database password is strong
- [ ] HTTPS is enabled (SSL certificate)
- [ ] CORS is configured correctly
- [ ] File permissions are set correctly (`.env` should be 600)

## Support

For Hostinger-specific issues, consult:
- Hostinger documentation
- Hostinger support
- Your hosting plan's Node.js limitations


