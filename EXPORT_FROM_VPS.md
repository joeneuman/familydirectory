# Export Database from VPS (Hostinger)

Since you're using a VPS, we'll use SSH to export the database directly from your production server.

## Step 1: SSH into Your Production Server

Connect to your VPS via SSH:

```bash
ssh username@your-server-ip
# or
ssh username@your-domain.com
```

## Step 2: Navigate to Your Backend Directory

Once connected, navigate to where your backend code is located:

```bash
cd /path/to/your/backend
# Common locations:
# - /home/username/familywebsite/backend
# - /var/www/familywebsite/backend
# - /opt/familywebsite/backend
```

## Step 3: Export the Database

Run the export script with data:

```bash
node scripts/export-database-sql.js --with-data
```

This will create a file called `database-export.sql` in the backend directory.

## Step 4: Download the SQL File

You have a few options:

### Option A: Using SCP (from your local machine)

Open a **new terminal window** on your local machine (keep the SSH session open), then:

```bash
scp username@your-server-ip:/path/to/backend/database-export.sql ./backend/
```

### Option B: Using SFTP

1. Use an SFTP client (FileZilla, WinSCP, etc.)
2. Connect to your server
3. Navigate to the backend directory
4. Download `database-export.sql`

### Option C: Using cat/echo (if file is small)

If the file is small, you can copy its contents:

```bash
# On the server, in the backend directory:
cat database-export.sql
```

Then copy and paste into a local file.

## Step 5: Import into Docker

Once you have the file locally, import it:

```bash
# Make sure Docker is running
docker compose -f docker-compose.dev.yml ps

# Import the database
docker exec -i family-directory-db-dev psql -U postgres -d family_directory < backend/database-export.sql
```

Or use the import script:

```bash
node backend/scripts/import-production-db.js backend/database-export.sql
```

## Alternative: Direct pg_dump (Faster for Large Databases)

If you have `pg_dump` installed on the VPS, you can use it directly:

```bash
# On the VPS, export directly:
pg_dump -h localhost -U your_db_user -d family_directory > production-export.sql

# Then download it using SCP:
# (from your local machine)
scp username@your-server-ip:/path/to/production-export.sql ./backend/
```

## Verify the Export

Before downloading, you can check the file size:

```bash
# On the VPS
ls -lh database-export.sql
```

This will show you the file size so you know what to expect.

## Troubleshooting

### "node: command not found"
Make sure Node.js is installed and in your PATH. You might need to:
```bash
which node
# If not found, check if it's in a different location or use full path
```

### "Cannot find module"
Make sure you're in the backend directory and dependencies are installed:
```bash
npm install
```

### "Permission denied" on SCP
Make sure the file is readable:
```bash
chmod 644 database-export.sql
```

### Database connection errors
If the export script can't connect, check your `.env` file on the VPS has correct database credentials.

