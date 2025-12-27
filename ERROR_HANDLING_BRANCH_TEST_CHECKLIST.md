# Error-Handling Branch Testing Checklist

Test all items below before merging to `master`.

## 🔐 Authentication & Magic Links

### Expired Magic Link Handling
- [ ] **Request a magic link** and wait for it to expire (15+ minutes)
- [ ] **Click the expired link** - should redirect to `/auth/expired` page
- [ ] **Verify expired page displays correctly:**
  - Shows "Magic Link Expired" message
  - Shows countdown timer (5, 4, 3, 2, 1) - each number for 2 seconds
  - Shows appropriate message based on login status
  - Redirects to home page after countdown
- [ ] **Test with logged-in user** - should show "You're already logged in" message
- [ ] **Test with logged-out user** - should show "You need to request another magic link" message
- [ ] **Click expired link multiple times** - should consistently show expired page (not error)
- [ ] **Test on mobile device** - verify it works correctly
- [ ] **Test on desktop browser** - verify it works correctly

### Valid Magic Links
- [ ] **Request a new magic link** and click it immediately
- [ ] **Verify login works** - should redirect to directory
- [ ] **Verify session persists** after page refresh

## 🐛 Error Handling & Reporting

### Global Error Handling
- [ ] **Trigger a JavaScript error** (open console, run invalid code)
- [ ] **Verify error page appears** at `/error`
- [ ] **Verify error.gif image displays** correctly
- [ ] **Check error details are shown** (if available)

### Error Report Form
- [ ] **Fill out error report form:**
  - Description (required)
  - Steps to reproduce (optional)
  - Email (auto-filled if logged in)
- [ ] **Submit error report**
- [ ] **Verify success message** appears
- [ ] **Check email** - error report should be sent to admin email
- [ ] **Verify form redirects** to directory after 3 seconds
- [ ] **Test with invalid data** - verify validation works

### Router Error Handling
- [ ] **Navigate to invalid route** (e.g., `/nonexistent`)
- [ ] **Verify error page appears** or 404 handling works
- [ ] **Test navigation errors** are caught

## ⚙️ Settings & Configuration

### Settings Page (Admin Only)
- [ ] **Login as admin user**
- [ ] **Navigate to Settings** from user dropdown menu
- [ ] **Verify Settings page loads** correctly
- [ ] **Change site name** and save
- [ ] **Verify site name updates** across the app:
  - Login page header
  - Main navigation header
  - Print views
- [ ] **Refresh page** - verify site name persists
- [ ] **Logout and login again** - verify site name persists
- [ ] **Test as non-admin user** - should not see Settings in menu
- [ ] **Try to access `/settings` directly** as non-admin - should redirect

### Environment Variables
- [ ] **Run environment check script:**
  ```bash
  cd backend
  node scripts/check-production-env.js
  ```
- [ ] **Verify all required variables** are set correctly
- [ ] **Check FRONTEND_URL** is set to `https://neumanfam.com`
- [ ] **Check BASE_URL** is set to `https://neumanfam.com`
- [ ] **Check NODE_ENV** is set to `production`

## 🖼️ Image Management

### Image Upload & Replacement
- [ ] **Upload a profile photo** for a person
- [ ] **Replace the photo** with a different one
- [ ] **Verify old photo is deleted** from uploads folder
- [ ] **Check new photo displays** correctly
- [ ] **Remove photo** (set to empty)
- [ ] **Verify photo file is deleted** from uploads folder

### Profile Deletion
- [ ] **Delete a person's profile** (admin only)
- [ ] **Verify associated photo is deleted** from uploads folder
- [ ] **Verify person is removed** from directory

## 🔄 Deployment & Scripts

### Frontend Rebuild Script
- [ ] **Test rebuild script:**
  ```bash
  ./rebuild-frontend.sh
  ```
- [ ] **Verify script:**
  - Installs dependencies
  - Builds frontend
  - Copies files to public directory
  - Restarts PM2
- [ ] **Check script is executable:**
  ```bash
  chmod +x rebuild-frontend.sh
  ```

### Database Migrations
- [ ] **Verify `app_settings` table exists:**
  ```bash
  psql -h localhost -U family_user -d family_directory -c "\d app_settings"
  ```
- [ ] **Check migration was applied** correctly
- [ ] **Verify no migration errors** in logs

## 🌐 Production Environment

### URL Configuration
- [ ] **Verify all URLs use production domain:**
  - Magic links point to `https://neumanfam.com`
  - Expired link redirects use `https://neumanfam.com`
  - No hardcoded `localhost` URLs
- [ ] **Test from different devices:**
  - Desktop browser
  - Mobile browser
  - Tablet (if available)

### Email Functionality
- [ ] **Request magic link** - verify email is received
- [ ] **Submit error report** - verify admin receives email
- [ ] **Check email formatting** is correct
- [ ] **Test with email service disabled** - verify graceful fallback

## 📱 User Experience

### Navigation
- [ ] **Test all navigation links** work correctly
- [ ] **Verify back button** works on error pages
- [ ] **Test browser refresh** on all pages
- [ ] **Check mobile menu** works correctly

### Print Views
- [ ] **Test all print views:**
  - Directory Print View
  - Label Print View
  - Print Options View
- [ ] **Verify print buttons** are visible in preview
- [ ] **Verify print buttons** are hidden when printing
- [ ] **Check site name** appears in print views

## 🔍 Edge Cases

### Token Cleanup
- [ ] **Wait for token cleanup** (runs every hour)
- [ ] **Click expired link after cleanup** - should still redirect to expired page
- [ ] **Verify no errors** in server logs

### Browser Compatibility
- [ ] **Test in Chrome**
- [ ] **Test in Firefox**
- [ ] **Test in Safari** (if available)
- [ ] **Test in Edge** (if available)
- [ ] **Test on mobile browsers:**
  - iOS Safari
  - Chrome Mobile
  - Firefox Mobile

### Error Scenarios
- [ ] **Test with network offline** - verify error handling
- [ ] **Test with slow connection** - verify loading states
- [ ] **Test with invalid API responses** - verify error handling

## 📊 Server Health

### PM2 Status
- [ ] **Check PM2 status:**
  ```bash
  pm2 status
  ```
- [ ] **Verify application is online**
- [ ] **Check memory usage** is reasonable
- [ ] **Review recent logs:**
  ```bash
  pm2 logs family-directory --lines 100
  ```

### Database Health
- [ ] **Verify database connections** are working
- [ ] **Check for any database errors** in logs
- [ ] **Verify migrations** are up to date

## ✅ Final Checks

### Code Quality
- [ ] **Review all changes** in the branch
- [ ] **Verify no console errors** in browser
- [ ] **Check server logs** for warnings or errors
- [ ] **Verify no hardcoded values** that should be configurable

### Documentation
- [ ] **Review updated documentation:**
  - `DEPLOYMENT_ENV_CHECKLIST.md`
  - `PULL_BRANCH_TO_PRODUCTION.md`
  - `rebuild-frontend.sh`
- [ ] **Verify documentation is accurate**

### Performance
- [ ] **Test page load times** - should be reasonable
- [ ] **Check bundle sizes** - verify no unexpected bloat
- [ ] **Test on slow connection** - verify acceptable performance

## 🚀 Pre-Merge Checklist

- [ ] **All tests above are passing**
- [ ] **No critical bugs** found
- [ ] **Code is reviewed** and approved
- [ ] **Documentation is updated**
- [ ] **Environment variables** are configured correctly
- [ ] **Database migrations** are applied
- [ ] **Frontend is rebuilt** with latest changes
- [ ] **Server is restarted** and running correctly

## 📝 Notes

Document any issues found during testing:

- Issue 1: [Description]
- Issue 2: [Description]
- etc.

---

**After completing all tests and fixing any issues, the branch is ready to merge to `master`.**

