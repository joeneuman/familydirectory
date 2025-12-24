# Production Deployment Checklist

Use this checklist to ensure a smooth deployment to Hostinger.

## Pre-Deployment

- [ ] All features tested locally
- [ ] Database migrations tested
- [ ] Environment variables documented
- [ ] JWT_SECRET generated (strong random string)
- [ ] Frontend built successfully (`npm run build`)
- [ ] No console errors in browser
- [ ] All API endpoints tested

## Hostinger Setup

- [ ] PostgreSQL database created
- [ ] Database credentials saved securely
- [ ] Node.js application created in hPanel
- [ ] Domain/subdomain configured
- [ ] SSL certificate installed (HTTPS)

## File Upload

- [ ] Backend files uploaded to server
- [ ] Frontend `dist` folder contents uploaded
- [ ] `.env` file created on server (NOT in git)
- [ ] File permissions set correctly (`.env` should be 600)

## Configuration

- [ ] Database credentials in `.env`
- [ ] JWT_SECRET set in `.env`
- [ ] FRONTEND_URL set to production domain
- [ ] BASE_URL set to production domain
- [ ] Email configuration (if using SMTP)
- [ ] CORS configured correctly

## Database

- [ ] Migrations run on production database
- [ ] Database schema verified
- [ ] Test data imported (optional for testing)

## Testing

- [ ] Website loads at production URL
- [ ] API endpoints accessible
- [ ] Magic link login works
- [ ] All features functional
- [ ] Mobile device testing (if applicable)
- [ ] No console errors

## Security

- [ ] `.env` file not accessible via web
- [ ] Strong passwords set
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] File uploads secured (if applicable)

## Post-Deployment

- [ ] Monitor error logs
- [ ] Test with real users (if applicable)
- [ ] Backup database
- [ ] Document any production-specific notes

## Rollback Plan

- [ ] Know how to revert to previous version
- [ ] Database backup before major changes
- [ ] Git tags for releases





