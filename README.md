# Family Directory Web App

A private, mobile-first family directory application built with Vue.js and Node.js. Designed for managing family member information with hierarchical edit permissions based on ancestry.

## Tech Stack

- **Frontend**: Vue 3, Vue Router, Pinia, Tailwind CSS, Vite
- **Backend**: Node.js, Express, PostgreSQL
- **Authentication**: Magic link (passwordless) email authentication
- **Deployment**: Designed for Linux server (DigitalOcean, etc.) behind nginx

## Features

- 🔐 Passwordless login with email magic links
- 👥 Family member directory with household grouping
- 🔍 Search and sort functionality
- ✏️ Hierarchical edit permissions (ancestors can edit descendants)
- 📅 Recent change highlighting (fields changed in last 3 months)
- 📱 Mobile-first responsive design
- 🖨️ Print-friendly directory view

## Project Structure

```
familywebsite/
├── backend/
│   ├── src/
│   │   ├── config/          # Database configuration
│   │   ├── models/           # Data models (Person, Household, etc.)
│   │   ├── routes/           # API routes
│   │   ├── middleware/       # Auth middleware
│   │   ├── utils/            # Utilities (permissions, email)
│   │   └── server.js         # Express server
│   ├── migrations/           # Database migrations
│   ├── scripts/              # Import scripts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── views/            # Vue pages
│   │   ├── stores/           # Pinia stores
│   │   ├── router/           # Vue Router config
│   │   └── App.vue
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 12+
- Email service (SendGrid, SMTP, or console logging for development)

### 1. Database Setup

Create a PostgreSQL database:

```bash
createdb family_directory
```

Or using psql:

```sql
CREATE DATABASE family_directory;
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory (copy from `.env.example`):

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=family_directory
DB_USER=postgres
DB_PASSWORD=your_password_here

JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
MAGIC_LINK_EXPIRY_MINUTES=15
BASE_URL=http://localhost:3000

EMAIL_SERVICE=smtp
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your_sendgrid_api_key_here
EMAIL_FROM=noreply@yourdomain.com

PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

Run database migrations:

```bash
npm run migrate
```

Start the backend server:

```bash
npm run dev
```

The backend will run on `http://localhost:3001`

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

### 4. Email Configuration

For **development**, the app will log magic links to the console if email is not configured.

For **production**, configure SendGrid or another SMTP service:

1. Sign up for SendGrid (or use your preferred email service)
2. Get your API key
3. Update `.env` with your email credentials:
   ```env
   EMAIL_SERVICE=smtp
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_USER=apikey
   EMAIL_PASSWORD=your_sendgrid_api_key
   EMAIL_FROM=noreply@yourdomain.com
   ```

## Importing Data from CSV

The app includes a CSV import script for initial data loading.

### CSV Format

Create a CSV file with the following columns:

- `first_name` (required)
- `last_name` (required)
- `email` (optional, but needed for login)
- `phone` (optional)
- `address_line1` (optional)
- `address_line2` (optional)
- `city` (optional)
- `state` (optional)
- `postal_code` (optional)
- `country` (optional, defaults to USA)
- `date_of_birth` (YYYY-MM-DD format, optional)
- `wedding_anniversary_date` (YYYY-MM-DD format, optional)
- `generation` (G1, G2, G3, etc.)
- `household_name` (required)
- `mother_name` (first_name last_name, optional)
- `father_name` (first_name last_name, optional)
- `spouse_name` (first_name last_name, optional)
- `is_deceased` (true/false, optional)
- `photo_url` (optional)

### Running the Import

```bash
cd backend
node scripts/import-csv.js path/to/your/data.csv
```

The script will:
1. Create households
2. Create persons
3. Link persons to households
4. Create parent-child relationships
5. Create marital relationships
6. Calculate ages and years married

## Usage

### Login

1. Navigate to the login page
2. Enter an email address that exists in the database
3. Click "Send Magic Link"
4. Check your email (or console in development) for the login link
5. Click the link to authenticate

### Viewing the Directory

- The home page shows all households
- Click a household to see its members
- Click a person to see their full details
- Use search to find people by name or email
- Use sort options to organize by birthday, anniversary, age, or generation

### Editing Information

- You can always edit your own information
- You can edit descendants (children, grandchildren, etc.)
- You can edit if you're the spouse of someone who can edit
- The "Edit Info" button only appears if you have permission

### Recent Changes

- Fields changed in the last 3 months are highlighted in yellow
- A legend explains the highlighting
- After 3 months, highlighting automatically disappears

## API Endpoints

### Authentication
- `POST /api/auth/request-link` - Request magic link
- `GET /api/auth/verify?token=...` - Verify magic link and login

### Households
- `GET /api/households` - Get all households
- `GET /api/households/:id` - Get single household

### Persons
- `GET /api/persons` - Get all persons (with search/sort query params)
- `GET /api/persons/:id` - Get single person with relationships
- `PUT /api/persons/:id` - Update person (requires edit permission)
- `GET /api/persons/me/info` - Get current user info

## Permission System

The `canEdit(currentUserId, targetPersonId)` function implements:

1. **Self-edit**: Always allowed
2. **Ancestor-edit**: If current user is an ancestor (parent, grandparent, etc.) of target
3. **Spouse-ancestor-edit**: If current user is spouse of someone who is an ancestor

This ensures hierarchical permissions where:
- G1 (your mother) can edit everyone
- G2 (you, siblings) can edit yourselves, spouses, and all descendants
- G3+ can edit themselves, spouses, and their descendants

## Deployment

### Production Environment Variables

Update `.env` for production:

```env
NODE_ENV=production
BASE_URL=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
DB_HOST=your_db_host
DB_PASSWORD=secure_password
JWT_SECRET=very_secure_random_string
```

### Build Frontend

```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist/`

### nginx Configuration Example

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Running Backend in Production

Use a process manager like PM2:

```bash
npm install -g pm2
cd backend
pm2 start src/server.js --name family-directory-api
pm2 save
pm2 startup
```

## Development Notes

- Magic links expire after 15 minutes (configurable)
- JWT tokens last 30 days
- Field-level change tracking updates timestamps automatically
- The app assumes all Person records are created by admin (no self-signup)

## License

Private family use only.





