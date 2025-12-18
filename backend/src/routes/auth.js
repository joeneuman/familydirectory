import express from 'express';
import { MagicLinkToken } from '../models/MagicLinkToken.js';
import { Person } from '../models/Person.js';
import { sendMagicLink } from '../utils/email.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Request magic link
router.post('/request-link', async (req, res) => {
  try {
    console.log('Magic link request received:', req.body);
    const { email } = req.body;

    if (!email) {
      console.log('No email provided');
      return res.status(400).json({ error: 'Email is required' });
    }

    console.log('Looking up person with email:', email);
    // Check if person exists
    const person = await Person.findByEmail(email);
    if (!person) {
      console.log('Person not found for email:', email);
      // Don't reveal if email exists or not for security
      return res.json({ 
        message: 'If an account exists with this email, a login link has been sent.' 
      });
    }

    console.log('Person found:', person.first_name, person.last_name);
    // Create magic link token
    const tokenRecord = await MagicLinkToken.create(email);
    console.log('Token created:', tokenRecord.token.substring(0, 10) + '...');
    
    // Send email
    try {
      console.log('Sending magic link email...');
      await sendMagicLink(email, tokenRecord.token);
      console.log('Magic link email sent successfully');
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      // Still return success to not reveal email issues
    }

    res.json({ 
      message: 'If an account exists with this email, a login link has been sent.' 
    });
  } catch (error) {
    console.error('Error requesting magic link:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify magic link and create session
router.get('/verify', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Find and validate token
    const tokenRecord = await MagicLinkToken.findByToken(token);
    if (!tokenRecord) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    // Get person
    const person = await Person.findByEmail(tokenRecord.email);
    if (!person) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Mark token as used
    await MagicLinkToken.markAsUsed(token);

    // Create JWT
    const jwtToken = jwt.sign(
      { personId: person.id, email: person.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' } // 30 day session
    );

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/callback?token=${jwtToken}`);
  } catch (error) {
    console.error('Error verifying magic link:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

