# Docker Setup for Local Testing

This Docker setup allows you to run the application in containers, matching the production environment.

## Prerequisites

- Docker Desktop installed (or Docker Engine + Docker Compose)
- Git

## Quick Start

### Production-like Environment

To run the app in production mode (matching server setup):

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode (background)
docker-compose up -d --build
```

This will start:
- PostgreSQL database on port 5432
- Backend API on port 3001
- Frontend (Nginx) on port 80

Access the app at: http://localhost

### Development Environment (with hot reload)

To run with hot reload for development:

```bash
# Build and start all services in dev mode
docker-compose -f docker-compose.dev.yml up --build

# Or run in detached mode
docker-compose -f docker-compose.dev.yml up -d --build
```

## Environment Variables

Create a `.env` file in the root directory (optional, defaults are provided):

```env
JWT_SECRET=your-secret-key-here
EMAIL_SERVICE=smtp
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-password
EMAIL_FROM=noreply@familydirectory.com
```

## Database Setup

The database will be automatically initialized with migrations when the container starts.

To run migrations manually:

```bash
# Access the backend container
docker exec -it family-directory-backend sh

# Run migrations
npm run migrate
```

## Useful Commands

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### Stop services
```bash
docker-compose down
```

### Stop and remove volumes (clean database)
```bash
docker-compose down -v
```

### Rebuild after code changes
```bash
docker-compose up --build
```

### Access container shell
```bash
# Backend
docker exec -it family-directory-backend sh

# Frontend
docker exec -it family-directory-frontend sh

# Database
docker exec -it family-directory-db psql -U postgres -d family_directory
```

## Testing the Expired Link Feature

1. Start the containers:
   ```bash
   docker-compose up --build
   ```

2. Access the app at http://localhost:5173

3. Request a magic link from the login page

4. Wait for the link to expire (default: 15 minutes), or manually expire it in the database:
   ```bash
   docker exec -it family-directory-db psql -U postgres -d family_directory
   ```
   ```sql
   UPDATE magic_link_tokens SET expires_at = NOW() - INTERVAL '1 minute' WHERE token = 'your-token-here';
   ```

5. Click the expired link - it should redirect to `/auth/expired` with the countdown timer

## Troubleshooting

### Port already in use
If ports 3001, 5173, or 5432 are already in use, you can change them in `docker-compose.yml`:
```yaml
ports:
  - "3002:3001"  # Change host port (left side)
```

### Database connection issues
Make sure the database container is healthy before the backend starts. The `depends_on` with `condition: service_healthy` handles this automatically.

### Frontend can't reach backend
In development mode, make sure `VITE_API_BASE_URL` is set correctly. The production setup uses Nginx to proxy `/api` requests.

### Clear everything and start fresh
```bash
docker-compose down -v
docker system prune -a
docker-compose up --build
```

