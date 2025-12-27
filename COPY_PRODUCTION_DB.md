# Copy Production Database to Docker

This guide will help you copy your production database into your local Docker environment.

## Prerequisites

- Docker containers running (`docker compose -f docker-compose.dev.yml up -d`)
- Access to production database credentials
- PostgreSQL client tools (for Option 1) OR ability to download SQL file from Hostinger

## Option 1: Using pg_dump (Recommended)

If you have `pg_dump` installed on your computer:

```bash
# Export from production
pg_dump -h <production-host> -U <production-user> -d <production-db-name> > production-export.sql

# Example:
# pg_dump -h your-production-host.com -U your_user -d family_directory > production-export.sql
```

Then import into Docker:

```bash
# Method A: Using the import script
node backend/scripts/import-production-db.js production-export.sql

# Method B: Direct Docker import
docker exec -i family-directory-db-dev psql -U postgres -d family_directory < production-export.sql
```

## Option 2: Using Hostinger Database Tool

1. **Log into Hostinger hPanel**
2. **Go to Databases → PostgreSQL Databases**
3. **Select your database**
4. **Use the Export/Backup feature** to download a SQL file
5. **Save the file** (e.g., `production-export.sql`)

Then import:

```bash
node backend/scripts/import-production-db.js production-export.sql
```

## Option 3: Using the Export Script (If you have SSH access to production)

If you can SSH into your production server:

1. **On production server:**
   ```bash
   cd /path/to/your/backend
   node scripts/export-database-sql.js --with-data
   ```
   
2. **Download the `database-export.sql` file** to your local machine

3. **Import into Docker:**
   ```bash
   node backend/scripts/import-production-db.js database-export.sql
   ```

## Option 4: Using the Export Script with Remote Connection

If you have production database credentials but can't SSH:

1. **Create `.env.production` file in `backend/` directory:**
   ```env
   PROD_DB_HOST=your-production-host.com
   PROD_DB_PORT=5432
   PROD_DB_NAME=family_directory
   PROD_DB_USER=your-username
   PROD_DB_PASSWORD=your-password
   ```

2. **Run the export script:**
   ```bash
   cd backend
   node scripts/export-from-production.js
   ```

3. **Import into Docker:**
   ```bash
   node scripts/import-production-db.js production-export.sql
   ```

## Verify Import

After importing, verify the data:

```bash
# Check persons count
docker exec -it family-directory-db-dev psql -U postgres -d family_directory -c "SELECT COUNT(*) FROM persons;"

# List all tables
docker exec -it family-directory-db-dev psql -U postgres -d family_directory -c "\dt"
```

## Troubleshooting

### "psql: command not found"
Install PostgreSQL client tools, or use the Docker method:
```bash
docker exec -i family-directory-db-dev psql -U postgres -d family_directory < production-export.sql
```

### "Connection refused" or "Cannot connect to production"
- Check that your production database allows remote connections
- Verify firewall rules allow your IP
- Check that credentials are correct

### "Permission denied" errors
- Make sure the Docker database container is running
- Check that the SQL file path is correct

### Import errors about existing tables
The import script uses `TRUNCATE` which will clear existing data. If you want to keep existing data, you may need to modify the SQL file first.

## Next Steps

After importing:
1. Restart your backend container to ensure it picks up the new data
2. Test logging in with a production email
3. Verify that all your family data is present

