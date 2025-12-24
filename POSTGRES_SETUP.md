# PostgreSQL Setup Guide

## Finding or Setting Your PostgreSQL Password

### Option 1: Check if PostgreSQL is Installed

**Windows:**
```powershell
# Check if PostgreSQL service is running
Get-Service -Name postgresql*

# Or check if psql command exists
psql --version
```

### Option 2: Default PostgreSQL Setup

On Windows, PostgreSQL is often installed with:
- **Username:** `postgres`
- **Password:** The one you set during installation (if you remember)
- **Default:** Sometimes no password is set, or it's `postgres`

### Option 3: Try Common Defaults

Try these common default passwords:
- `postgres`
- `admin`
- `password`
- (blank/empty - just press Enter)

### Option 4: Reset PostgreSQL Password (Windows)

If you can't remember the password, you can reset it:

**Method A: Using pgAdmin (if installed)**
1. Open pgAdmin
2. Connect to server (might work without password)
3. Right-click on server → Properties → Change password

**Method B: Using Command Line**

1. **Stop PostgreSQL service:**
   ```powershell
   Stop-Service postgresql-x64-XX  # Replace XX with your version number
   ```

2. **Edit pg_hba.conf file** (usually in `C:\Program Files\PostgreSQL\XX\data\pg_hba.conf`):
   - Find the line: `host all all 127.0.0.1/32 md5`
   - Change `md5` to `trust`
   - Save the file

3. **Start PostgreSQL service:**
   ```powershell
   Start-Service postgresql-x64-XX
   ```

4. **Connect without password:**
   ```powershell
   psql -U postgres
   ```

5. **Set new password:**
   ```sql
   ALTER USER postgres PASSWORD 'your_new_password';
   ```

6. **Revert pg_hba.conf** - Change `trust` back to `md5`

7. **Restart PostgreSQL service**

### Option 5: Create a New PostgreSQL User (Easier)

If you can access PostgreSQL (even without password), create a new user:

```powershell
# Try connecting (might work without password)
psql -U postgres

# If that works, create a new user:
```

```sql
CREATE USER family_user WITH PASSWORD 'family_password';
ALTER USER family_user CREATEDB;
\q
```

Then use this in your `.env`:
```env
DB_USER=family_user
DB_PASSWORD=family_password
```

### Option 6: Install PostgreSQL Fresh (If Not Installed)

**Windows:**
1. Download from: https://www.postgresql.org/download/windows/
2. Run installer
3. **Remember the password you set!**
4. Default port: 5432
5. Default user: postgres

**Or use Chocolatey:**
```powershell
choco install postgresql
```

### Option 7: Use Docker (Alternative)

If PostgreSQL setup is too complicated, use Docker:

```powershell
# Install Docker Desktop first, then:
docker run --name family-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=family_directory -p 5432:5432 -d postgres
```

Then use in `.env`:
```env
DB_USER=postgres
DB_PASSWORD=postgres
```

## Testing Your Connection

Once you have credentials, test:

```powershell
psql -U postgres -d postgres
# Enter password when prompted
```

If successful, you'll see:
```
postgres=#
```

## Quick Setup for This Project

Once you can connect, create the database:

```sql
CREATE DATABASE family_directory;
\q
```

Then update `backend/.env`:
```env
DB_USER=postgres
DB_PASSWORD=your_actual_password_here
```






