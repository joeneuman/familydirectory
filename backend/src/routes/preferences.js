import express from 'express';
import { UserPreferences } from '../models/UserPreferences.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get user preference
router.get('/:key', async (req, res) => {
  try {
    const value = await UserPreferences.get(req.user.id, req.params.key);
    if (value === null) {
      return res.status(404).json({ error: 'Preference not found' });
    }
    try {
      res.json(JSON.parse(value));
    } catch (e) {
      res.json(value);
    }
  } catch (error) {
    console.error('Error fetching preference:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Set user preference
router.post('/:key', async (req, res) => {
  try {
    await UserPreferences.set(req.user.id, req.params.key, req.body);
    res.json({ success: true });
  } catch (error) {
    console.error('Error setting preference:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all user preferences
router.get('/', async (req, res) => {
  try {
    const preferences = await UserPreferences.getAll(req.user.id);
    res.json(preferences);
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;






