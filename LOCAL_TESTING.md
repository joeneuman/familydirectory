# Local Testing Guide

This guide will help you test the Family Directory app completely on your local machine.

## Prerequisites

Before starting, make sure you have:

1. **Node.js 18+** - Check with: `node --version`
2. **PostgreSQL** - Check with: `psql --version`
3. **npm** - Comes with Node.js

### Installing PostgreSQL (if needed)

**Windows:**
- Download from https://www.postgresql.org/download/windows/
- Or use: `choco install postgresql` (if you have Chocolatey)

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

## Step-by-Step Local Setup

### 1. Create the Database

```bash
# Create database
createdb family_directory

# Or if that doesn't work:
psql -U postgres
CREATE DATABASE family_directory;
\q
```

### 2. Set Up Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

**Windows (PowerShell):**
```powershell
@"
DB_HOST=localhost
DB_PORT=5432
DB_NAME=family_directory
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=dev-secret-key-change-in-production-12345
MAGIC_LINK_EXPIRY_MINUTES=15
BASE_URL=http://localhost:3001
EMAIL_SERVICE=console
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
"@ | Out-File -FilePath .env -Encoding utf8
```

**macOS/Linux:**
```bash
cat > .env << 'EOF'
DB_HOST=localhost
DB_PORT=5432
DB_NAME=family_directory
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=dev-secret-key-change-in-production-12345
MAGIC_LINK_EXPIRY_MINUTES=15
BASE_URL=http://localhost:3001
EMAIL_SERVICE=console
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
EOF
```

**Important:** Replace `DB_PASSWORD` with your actual PostgreSQL password if different.

### 3. Run Database Migrations

```bash
cd backend
npm run migrate
```

You should see: `Migration completed successfully!`

### 4. Start Backend Server

```bash
cd backend
npm run dev
```

You should see:
```
Server running on port 3001
Environment: development
Connected to PostgreSQL database
```

**Keep this terminal open!**

### 5. Set Up Frontend (New Terminal)

Open a **new terminal window** and:

```bash
cd frontend
npm install
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

### 6. Add Test Data

You need at least one person in the database to test login. Choose one method:

#### Option A: Use Sample CSV (Easiest)

```bash
cd backend
node scripts/import-csv.js sample-data.csv
```

This will create:
- 2 households
- 6 people (Jane & John Smith, Alice & Bob Doe, Charlie & Emma Doe)
- Relationships between them

#### Option B: Manual SQL (Quick Test)

```bash
psql -U postgres -d family_directory
```

Then run:

```sql
-- Create household
INSERT INTO households (name) VALUES ('Test Household') RETURNING id;

-- Note the ID, then create a person (replace HOUSEHOLD_ID with the UUID from above)
INSERT INTO persons (
  first_name, last_name, email, generation, primary_household_id
) VALUES (
  'Test', 'User', 'test@example.com', 'G1', 'HOUSEHOLD_ID'
);
```

### 7. Test Login

1. Open browser to: **http://localhost:5173**
2. You should see the login page
3. Enter an email from your test data (e.g., `test@example.com` or `jane.smith@example.com`)
4. Click "Send Magic Link"
5. **Check your backend terminal** - you'll see something like:

```
=== EMAIL (Development Mode) ===
To: test@example.com
Subject: Your Family Directory Login Link
Text: Click this link to log in...
HTML: <div>...
===============================
```

6. **Copy the magic link** from the console output (look for the URL)
7. **Paste it in your browser** - it will look like:
   ```
   http://localhost:3001/api/auth/verify?token=xxxx-xxxx-xxxx
   ```
8. You'll be redirected to the directory page and logged in!

## Testing Features

### Test Directory View
- See all households
- Click a household to see members
- Click a person to see details

### Test Search
- Use the search box to find people by name or email
- Try different sort options (birthday, anniversary, age, generation)

### Test Edit Permissions
1. Log in as a G1 person (e.g., Jane Smith)
2. Try to edit a G2 person (e.g., Alice Smith) - should work
3. Try to edit a G3 person (e.g., Charlie Doe) - should work
4. Log in as a G3 person
5. Try to edit a G1 person - should NOT work (no Edit button)

### Test Recent Changes
1. Edit a person's phone number
2. Go back to their detail page
3. The phone field should be highlighted in yellow
4. A legend should appear explaining the highlighting

### Test Relationships
- View a person's detail page
- See their spouse, parents, and children (if relationships exist)
- Click on related people to navigate

## Common Local Testing Issues

### "Cannot connect to database"
- **Check PostgreSQL is running:**
  - Windows: Check Services app for "postgresql"
  - macOS: `brew services list | grep postgresql`
  - Linux: `sudo systemctl status postgresql`
- **Check database exists:**
  ```bash
  psql -U postgres -l | grep family_directory
  ```
- **Check credentials in `.env` file**

### "Port 3001 already in use"
- Another process is using port 3001
- Change `PORT` in `.env` to something else (e.g., 3002)
- Or find and kill the process using port 3001

### "Port 5173 already in use"
- Vite dev server port conflict
- Vite will automatically try the next port (5174, 5175, etc.)
- Or change it in `vite.config.js`

### "Magic link not working"
- Make sure you're copying the FULL URL from the backend console
- The URL should start with `http://localhost:3001/api/auth/verify?token=...`
- Check that `BASE_URL` in `.env` is `http://localhost:3001` (backend port)

### "CORS error"
- Make sure `FRONTEND_URL` in backend `.env` matches your frontend URL
- Default is `http://localhost:5173`
- If Vite uses a different port, update `.env`

### "No people showing up"
- Make sure you imported data or added people manually
- Check database: `psql -U postgres -d family_directory -c "SELECT * FROM persons;"`

## Quick Test Checklist

- [ ] Database created and migrations run
- [ ] Backend server running on port 3001
- [ ] Frontend dev server running on port 5173
- [ ] At least one person added to database with email
- [ ] Can request magic link
- [ ] Magic link appears in backend console
- [ ] Can click magic link and log in
- [ ] Can see directory/home page
- [ ] Can view households and people
- [ ] Can search and sort
- [ ] Can view person details
- [ ] Can edit own information
- [ ] Edit permissions work correctly

## Next Steps After Local Testing

Once everything works locally:

1. **Import your real family data** (see `CSV_IMPORT_GUIDE.md`)
2. **Configure email** for production (SendGrid or similar)
3. **Deploy to server** (see `README.md`)

## Development Tips

- **Hot Reload**: Both frontend and backend support hot reload during development
- **Database Reset**: To start fresh:
  ```sql
  DROP DATABASE family_directory;
  CREATE DATABASE family_directory;
  ```
  Then run migrations again
- **View Database**: Use a tool like pgAdmin, DBeaver, or `psql` to inspect data
- **Backend Logs**: All API requests and errors appear in the backend terminal
- **Frontend Logs**: Open browser DevTools console to see frontend logs



