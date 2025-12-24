# Hostinger Manual Setup Guide

This guide will help you set up your Family Directory application manually in Hostinger's control panel.

## Step 1: Create PostgreSQL Database

1. **In Hostinger hPanel:**
   - Go to **Databases** → **PostgreSQL Databases**
   - Click **Create Database** or **Add Database**

2. **Fill in the details:**
   - Database name: `family_directory` (or your preferred name)
   - Username: (auto-generated or choose your own)
   - Password: (create a strong password - **SAVE THIS**)
   - Host: Usually `localhost` (Hostinger will show you)
   - Port: Usually `5432`

3. **Save these credentials** - you'll need them for the `.env` file:
   - Database Host
   - Database Port
   - Database Name
   - Database Username
   - Database Password

## Step 2: Upload Database Schema

1. **In Hostinger hPanel:**
   - Go to **Databases** → **PostgreSQL Databases**
   - Find your database and click **Manage** or **phpPgAdmin** (or similar)

2. **Import the SQL file:**
   - Open the SQL editor/query tool
   - Copy the contents of `backend/scripts/create-database-schema-only.sql`
   - Paste into the SQL editor
   - Click **Execute** or **Run**

   **OR** if there's an Import option:
   - Use the Import feature
   - Upload `backend/scripts/create-database-schema-only.sql`

3. **Verify tables were created:**
   - Check that these tables exist:
     - `households`
     - `persons`
     - `relationships`
     - `marital_relationships`
     - `magic_link_tokens`
     - `user_preferences`

## Step 3: Upload Application Files

### Option A: Using File Manager

1. **In Hostinger hPanel:**
   - Go to **Files** → **File Manager**

2. **Navigate to your domain's root:**
   - Usually `public_html` or `domains/yourdomain.com/public_html`

3. **Upload the zip file:**
   - Click **Upload**
   - Select `family-directory-production.zip`
   - Wait for upload to complete

4. **Extract the zip:**
   - Right-click the zip file
   - Select **Extract** or **Unzip**
   - Extract to the current directory (or a subdirectory if preferred)

5. **Verify files:**
   - You should see:
     - `src/` folder
     - `migrations/` folder
     - `scripts/` folder
     - `public/` folder
     - `package.json`
     - `env.example`

### Option B: Using FTP/SFTP

1. **Get FTP credentials from Hostinger:**
   - Go to **FTP Accounts** in hPanel
   - Note your FTP host, username, and password

2. **Use an FTP client** (FileZilla, WinSCP, etc.):
   - Connect to your Hostinger server
   - Navigate to `public_html` or your domain folder
   - Upload and extract the zip file

## Step 4: Create Environment File

1. **In File Manager:**
   - Navigate to where you extracted the files
   - Find `env.example`
   - Copy it and rename to `.env`

2. **Edit the `.env` file** with your production settings:

```env
# Database Configuration (from Step 1)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password

# Server Configuration
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

# Magic Link Expiry (optional)
MAGIC_LINK_EXPIRY_MINUTES=15
```

**To generate JWT_SECRET:**
- You can use an online generator, or
- Run locally: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

## Step 5: Set Up Node.js Application

1. **In Hostinger hPanel:**
   - Go to **Node.js** (or **Advanced** → **Node.js**)

2. **Create New Application:**
   - Click **Create Application** or **Add Application**

3. **Configure the application:**
   - **Application Root:** `/home/username/public_html` (or where you extracted files)
   - **Application URL:** `yourdomain.com` or `api.yourdomain.com`
   - **Application Startup File:** `src/server.js`
   - **Node.js Version:** 18.x or 20.x (choose latest stable)
   - **Application Mode:** Production

4. **Save/Deploy the application**

5. **Install Dependencies:**
   - Hostinger might do this automatically, or
   - Use SSH/Terminal if available:
     ```bash
     cd /home/username/public_html
     npm install --production
     ```

## Step 6: Run Database Migrations

If you haven't imported the SQL file, or need to run migrations:

1. **Via SSH/Terminal** (if available):
   ```bash
   cd /home/username/public_html
   node migrations/run-migrations.js
   ```

2. **Or verify the database schema** was imported correctly in Step 2

## Step 7: Configure Domain/DNS

1. **Point your domain to the application:**
   - In Hostinger, go to **Domains**
   - Ensure your domain points to the correct directory
   - If using a subdomain for API, create it in **Subdomains**

2. **SSL Certificate:**
   - Go to **SSL** in hPanel
   - Enable SSL for your domain (free Let's Encrypt usually available)

## Step 8: Test the Application

1. **Visit your domain:** `https://yourdomain.com`
2. **Test the API:** `https://yourdomain.com/api/health`
   - Should return: `{"status":"ok"}`

3. **Test login:**
   - Try requesting a magic link
   - Check backend logs if available

## Troubleshooting

### Application won't start
- Check Node.js version matches (18.x or 20.x)
- Verify `src/server.js` exists
- Check `.env` file has correct values
- Look at application logs in Hostinger

### Database connection fails
- Verify database credentials in `.env`
- Check database host/port
- Ensure database user has proper permissions
- Test connection from Hostinger's database tool

### 404 errors
- Verify files are in correct location
- Check Node.js application is running
- Verify domain points to correct directory

### CORS errors
- Check `FRONTEND_URL` in `.env` matches your domain
- Verify CORS configuration in `src/server.js`

## Next Steps

After setup is complete:
1. Import your data (if you have any)
2. Test all features
3. Set up email (if using SMTP)
4. Configure backups

## Getting Help

- **Hostinger Support:** Use their live chat or ticket system
- **Check Logs:** Look for error logs in Hostinger's Node.js manager
- **Test Locally First:** Make sure everything works locally before deploying





