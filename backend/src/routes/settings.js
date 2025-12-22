import express from 'express';
import { AppSettings } from '../models/AppSettings.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get site name (public - no auth required)
router.get('/site-name', async (req, res) => {
  try {
    const siteName = await AppSettings.get('site_name');
    res.json({ siteName: siteName || 'Family Directory' });
  } catch (error) {
    console.error('Error fetching site name:', error);
    // Return default value instead of error if table doesn't exist
    res.json({ siteName: 'Family Directory' });
  }
});

// Get all settings (admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const settings = await AppSettings.getAll();
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Set site name (admin only)
router.post('/site-name', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    await AppSettings.set('site_name', req.body.value, req.user.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error setting site name:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

