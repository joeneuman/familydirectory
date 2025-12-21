# Database Upload Guide for Hostinger

Hostinger requires the database to be uploaded separately from the application code. Follow these steps:

## Option 1: Upload SQL Schema File (Recommended for Fresh Install)

### Step 1: Use the Schema-Only SQL File

1. Use the file: `backend/scripts/create-database-schema-only.sql`
   - This contains only the database structure (no data)
   - Perfect for a fresh installation

2. **In Hostinger's Database Management Tool:**
   - Log into Hostinger hPanel
   - Go to **Databases** → **PostgreSQL Databases** (or phpMyAdmin if using MySQL)
   - Select your database
   - Click **SQL** or **Import** tab
   - Copy and paste the contents of `create-database-schema-only.sql`
   - Click **Execute** or **Go**

### Step 2: Verify Tables Created

After running the SQL, verify these tables exist:
- `households`
- `persons`
- `relationships`
- `marital_relationships`
- `magic_link_tokens`
- `user_preferences`

## Option 2: Export from Local Database (If You Have Data)

### Step 1: Export Database from Local

If you have data in your local database that you want to import:

```bash
cd backend
npm run export:db:with-data
```

This creates `database-export.sql` with both schema and data.

### Step 2: Upload to Hostinger

1. Open the generated `database-export.sql` file
2. In Hostinger's database tool:
   - Go to **SQL** or **Import** tab
   - Paste the SQL content
   - Click **Execute**

**Note:** Make sure your local database is up-to-date before exporting!

## Option 3: Use Hostinger's Migration Tool

If Hostinger provides a migration/import tool:

1. Export your local database using pg_dump (PostgreSQL):
   ```bash
   pg_dump -h localhost -U your_user -d family_directory > database-dump.sql
   ```

2. Upload the dump file via Hostinger's import tool

## Manual Table Creation (Alternative)

If SQL import doesn't work, you can run migrations via Node.js:

1. After uploading your application code
2. SSH into your Hostinger server (if available)
3. Navigate to your application directory
4. Run:
   ```bash
   node migrations/run-migrations.js
   ```

## Important Notes

- **Backup First:** Always backup your production database before making changes
- **Test Locally:** Test the SQL file on a local database first
- **Check Permissions:** Ensure your database user has CREATE TABLE permissions
- **UUID Extension:** The schema requires the `uuid-ossp` extension - Hostinger should have this enabled by default

## Troubleshooting

### "Extension uuid-ossp does not exist"
- Contact Hostinger support to enable the extension
- Or remove UUID defaults and use regular serial IDs

### "Permission denied"
- Check that your database user has CREATE privileges
- Contact Hostinger support if needed

### "Table already exists"
- Drop existing tables first (if safe to do so)
- Or use `CREATE TABLE IF NOT EXISTS` (already in the SQL)

## After Database Setup

1. Update your `.env` file with the production database credentials
2. Test the connection from your application
3. Verify the application can read/write to the database




