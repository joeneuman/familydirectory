# VPS Deployment Guide - Hostinger

Complete guide for deploying Family Directory to your Hostinger VPS.

## Prerequisites

- VPS server with SSH access
- Domain name pointing to your VPS
- PostgreSQL database (can be on same server or remote)

## Step 1: Connect to Your VPS

### Windows (PowerShell or Command Prompt)

```bash
ssh root@31.97.137.238
```

When prompted, enter your root password.

### First Time Connection

You'll see a message about host authenticity - type `yes` to continue.

## Step 2: Update System (Recommended)

Once connected, update your system:

```bash
apt update && apt upgrade -y
```

## Step 3: Install Required Software

### Install Node.js 20.x

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
```

Verify installation:
```bash
node --version
npm --version
```

### Install PM2 (Process Manager)

```bash
npm install -g pm2
```

PM2 will keep your application running and restart it if it crashes.

### Install PostgreSQL Client (if needed)

```bash
apt-get install -y postgresql-client
```

## Step 4: Upload Application Files

### Option A: Using SCP from Your Local Machine

From your **local Windows machine**, open PowerShell and run:

```powershell
# Navigate to your project directory
cd C:\Users\Joe\CODE\familywebsite

# Upload the zip file
scp family-directory-production.zip root@31.97.137.238:/root/

# Or upload the extracted deployment folder
scp -r deployment/* root@31.97.137.238:/var/www/family-directory/
```

### Option B: Using File Manager + SSH

1. Upload `family-directory-production.zip` via Hostinger's File Manager
2. Extract it via SSH:

```bash
cd /var/www  # or wherever you uploaded it
unzip family-directory-production.zip -d family-directory
cd family-directory
```

### Option C: Using Git (if you have a repository)

```bash
cd /var/www
git clone your-repo-url family-directory
cd family-directory
npm run build:frontend  # Build frontend
```

## Step 5: Set Up Application Directory

Choose where to install your app (common locations):

```bash
# Option 1: /var/www (common for web apps)
mkdir -p /var/www/family-directory
cd /var/www/family-directory

# Option 2: /opt (for applications)
mkdir -p /opt/family-directory
cd /opt/family-directory

# Option 3: /home/username (user directory)
mkdir -p /home/username/family-directory
cd /home/username/family-directory
```

**Recommended:** `/var/www/family-directory`

## Step 6: Copy Files to Application Directory

If you uploaded to a different location:

```bash
# Copy files to your chosen directory
cp -r /root/deployment/* /var/www/family-directory/
cd /var/www/family-directory
```

## Step 7: Run Deployment Script

Make the script executable and run it:

```bash
chmod +x deploy-to-vps.sh
./deploy-to-vps.sh
```

Or manually follow the steps in the script.

## Step 8: Configure Environment Variables

Edit the `.env` file:

```bash
nano .env
```

Fill in your production values:
- Database credentials (from Hostinger database)
- JWT_SECRET (generate a strong random string)
- FRONTEND_URL (your domain)
- BASE_URL (your domain)
- Email settings (if using SMTP)

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Save and exit: `Ctrl+X`, then `Y`, then `Enter`

## Step 9: Install Dependencies

```bash
npm install --production
```

## Step 10: Set Up Database

### If database is on Hostinger (remote):

1. Get database credentials from Hostinger dashboard
2. Update `.env` with those credentials
3. Test connection:
   ```bash
   PGPASSWORD=your_password psql -h your_db_host -U your_db_user -d your_db_name -c "SELECT 1;"
   ```

### If installing PostgreSQL on VPS:

```bash
apt-get install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

# Create database
sudo -u postgres psql
CREATE DATABASE family_directory;
CREATE USER family_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE family_directory TO family_user;
\q
```

## Step 11: Run Database Migrations

```bash
node migrations/run-migrations.js
```

Or import the SQL file:
```bash
psql -h your_db_host -U your_db_user -d your_db_name < scripts/create-database-schema-only.sql
```

## Step 12: Start Application with PM2

```bash
# Create PM2 ecosystem file (or use the one from deployment)
pm2 start src/server.js --name family-directory

# Or use ecosystem config
pm2 start ecosystem.config.js
```

## Step 13: Configure PM2

```bash
# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup
# Follow the instructions it provides (usually run a sudo command)
```

## Step 14: Set Up Nginx (Reverse Proxy)

Install Nginx:

```bash
apt-get install -y nginx
```

Create Nginx configuration:

```bash
nano /etc/nginx/sites-available/family-directory
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend static files
    location / {
        root /var/www/family-directory/public;
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
ln -s /etc/nginx/sites-available/family-directory /etc/nginx/sites-enabled/
nginx -t  # Test configuration
systemctl restart nginx
```

## Step 15: Set Up SSL (HTTPS)

Install Certbot:

```bash
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Step 16: Firewall Configuration

```bash
# Allow HTTP, HTTPS, and SSH
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

## Step 17: Verify Everything Works

1. **Check PM2 status:**
   ```bash
   pm2 status
   pm2 logs family-directory
   ```

2. **Check Nginx:**
   ```bash
   systemctl status nginx
   ```

3. **Test API:**
   ```bash
   curl http://localhost:3001/api/health
   ```

4. **Visit your domain:**
   - Open `https://yourdomain.com` in browser
   - Test login functionality

## Useful Commands

### PM2 Management
```bash
pm2 status              # Check app status
pm2 logs family-directory  # View logs
pm2 restart family-directory  # Restart app
pm2 stop family-directory    # Stop app
pm2 delete family-directory   # Remove from PM2
```

### View Logs
```bash
# Application logs
pm2 logs family-directory

# Nginx logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# System logs
journalctl -u nginx -f
```

### Update Application
```bash
cd /var/www/family-directory
# Pull updates or upload new files
npm install --production
pm2 restart family-directory
```

## Troubleshooting

### Application won't start
- Check `.env` file has correct values
- Check database connection
- View logs: `pm2 logs family-directory`

### 502 Bad Gateway
- Check if Node.js app is running: `pm2 status`
- Check if app is listening on port 3001: `netstat -tlnp | grep 3001`
- Check Nginx error logs

### Database connection fails
- Verify credentials in `.env`
- Check if database allows connections from your VPS IP
- Test connection manually with `psql`

### Port already in use
- Find what's using the port: `lsof -i :3001`
- Kill the process or change port in `.env`

## Security Checklist

- [ ] Firewall configured (UFW)
- [ ] SSL certificate installed (HTTPS)
- [ ] `.env` file has secure permissions (chmod 600)
- [ ] Strong passwords for database and JWT_SECRET
- [ ] Regular backups configured
- [ ] PM2 running as non-root user (recommended)

## Next Steps

1. Import your data (if you have any)
2. Set up automated backups
3. Configure monitoring
4. Test all features

Need help with any specific step? Let me know!


