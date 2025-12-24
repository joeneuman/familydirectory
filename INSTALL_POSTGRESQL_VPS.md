# Installing PostgreSQL on VPS

Since you have a VPS, you can install PostgreSQL directly on the server.

## Option 1: Install PostgreSQL on Your VPS (Recommended)

Run these commands in your SSH session:

```bash
# Update package list
apt update

# Install PostgreSQL
apt install postgresql postgresql-contrib -y

# Start PostgreSQL service
systemctl start postgresql
systemctl enable postgresql

# Check if it's running
systemctl status postgresql
```

## Option 2: Check if PostgreSQL is Already Installed

```bash
# Check if PostgreSQL is installed
which psql
psql --version

# Check if service is running
systemctl status postgresql
```

## Option 3: Use Hostinger's Database Service

If Hostinger provides a managed database service:
- Look for "Managed Databases" or "Database Hosting" in hPanel
- Or check under "Services" or "Add-ons"
- Some VPS plans include a separate database hosting option

## After Installing PostgreSQL

1. **Create database and user:**
```bash
sudo -u postgres psql
```

Then in the PostgreSQL prompt:
```sql
CREATE DATABASE family_directory;
CREATE USER family_user WITH PASSWORD 'your_strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE family_directory TO family_user;
\q
```

2. **Update your .env file:**
- DB_HOST=localhost
- DB_PORT=5432
- DB_NAME=family_directory
- DB_USER=family_user
- DB_PASSWORD=your_strong_password_here





