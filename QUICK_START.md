# Quick Start Guide

Get your family directory up and running in minutes.

## Prerequisites Check

- [ ] Node.js 18+ installed (`node --version`)
- [ ] PostgreSQL installed and running
- [ ] npm installed

## 5-Minute Setup

### 1. Database Setup (1 minute)

```bash
# Create database
createdb family_directory

# Or using psql:
psql -U postgres
CREATE DATABASE family_directory;
\q
```

### 2. Backend Setup (2 minutes)

```bash
cd backend
npm install

# Create .env file
cat > .env << EOF
DB_HOST=localhost
DB_PORT=5432
DB_NAME=family_directory
DB_USER=postgres
DB_PASSWORD=your_password_here
JWT_SECRET=$(openssl rand -hex 32)
MAGIC_LINK_EXPIRY_MINUTES=15
BASE_URL=http://localhost:3000
EMAIL_SERVICE=console
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
EOF

# Run migrations
npm run migrate

# Start server (in a separate terminal)
npm run dev
```

### 3. Frontend Setup (1 minute)

```bash
cd frontend
npm install
npm run dev
```

### 4. Test It (1 minute)

1. Open http://localhost:5173
2. You'll see the login page
3. But first, you need to add at least one person to the database!

## Adding Your First Person

### Option A: Manual SQL Insert

```sql
psql -U postgres -d family_directory

-- Create a household
INSERT INTO households (name) VALUES ('My Household') RETURNING id;

-- Save the household ID, then create a person
-- Replace HOUSEHOLD_ID with the ID from above
INSERT INTO persons (
  first_name, last_name, email, generation, primary_household_id
) VALUES (
  'Your', 'Name', 'your.email@example.com', 'G1', 'HOUSEHOLD_ID'
) RETURNING id;
```

### Option B: CSV Import

1. Create a CSV file with your data (see `CSV_IMPORT_GUIDE.md`)
2. Run: `cd backend && node scripts/import-csv.js your-data.csv`

## First Login

1. Go to http://localhost:5173
2. Enter the email you added to the database
3. Click "Send Magic Link"
4. **Check your terminal/console** - the magic link will be logged there (since email is set to "console" mode)
5. Copy the link from the console and open it in your browser
6. You're logged in!

## Next Steps

- Import your full family data (see `CSV_IMPORT_GUIDE.md`)
- Configure email for production (see `README.md`)
- Add more people through the web interface
- Test the edit permissions

## Troubleshooting

**"Cannot connect to database"**
- Check PostgreSQL is running: `pg_isready`
- Verify database exists: `psql -l | grep family_directory`
- Check `.env` file has correct credentials

**"Migration failed"**
- Make sure database is empty or doesn't have conflicting tables
- Check PostgreSQL user has CREATE privileges

**"Magic link not working"**
- In development, links are logged to console (backend terminal)
- Check the backend terminal for the full URL
- Make sure `BASE_URL` in `.env` matches your setup

**"Can't edit person"**
- You can only edit yourself, descendants, or if you're spouse of an ancestor
- Make sure relationships are set up correctly in the database

## Production Deployment

See the main `README.md` for:
- Email configuration (SendGrid)
- nginx setup
- PM2 process management
- Environment variables for production






