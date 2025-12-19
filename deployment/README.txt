# Family Directory - Production Deployment

## File Structure

- `src/` - Backend API source files
- `migrations/` - Database migration files
- `scripts/` - Utility scripts
- `public/` - Frontend static files
- `package.json` - Node.js application configuration
- `env.example` - Environment variables template

## Setup Instructions

1. Upload and extract this zip file to your Hostinger hosting
2. In Hostinger's Node.js manager, set:
   - Application root: (where you extracted the files)
   - Application startup file: src/server.js
   - Node version: 18.x or 20.x
3. Create `.env` file in the root directory (copy from env.example)
4. Fill in your environment variables:
   - Database credentials
   - JWT_SECRET (generate with: node scripts/generate-jwt-secret.js)
   - FRONTEND_URL (your domain, e.g., https://yourdomain.com)
   - BASE_URL (your domain)
5. Install dependencies: npm install --production
6. Run database migrations: node migrations/run-migrations.js
7. Start the application (usually automatic in Hostinger Node.js manager)

## Important Notes

- The backend serves the frontend files from the `public/` folder
- Make sure your domain points to where you extracted the files
- The application runs on the port specified in your Node.js app settings
- Check Hostinger's documentation for Node.js app configuration

## Environment Variables

Required in `.env` file:
- DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
- JWT_SECRET (strong random string)
- FRONTEND_URL (your production domain)
- BASE_URL (your production domain)
- NODE_ENV=production

See PRODUCTION_DEPLOYMENT.md for detailed instructions.
