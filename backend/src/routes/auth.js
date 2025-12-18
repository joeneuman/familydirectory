import express from 'express';
import { MagicLinkToken } from '../models/MagicLinkToken.js';
import { Person } from '../models/Person.js';
import { sendMagicLink } from '../utils/email.js';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

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
  console.log('=== VERIFY ENDPOINT HIT ===');
  console.log('Query params:', req.query);
  try {
    const { token } = req.query;

    if (!token) {
      console.log('No token provided');
      return res.status(400).json({ error: 'Token is required' });
    }

    console.log('Verifying token:', token.substring(0, 10) + '...');
    console.log('Full token:', token);

    // Find and validate token
    const tokenRecord = await MagicLinkToken.findByToken(token);
    console.log('Token lookup result:', tokenRecord ? 'Found' : 'Not found');
    
    if (!tokenRecord) {
      console.log('No token record found, checking database...');
      // Check if token exists but is expired or used
      const allTokens = await pool.query(
        'SELECT * FROM magic_link_tokens WHERE token = $1',
        [token]
      );
      
      console.log('Tokens found in database:', allTokens.rows.length);
      
      if (allTokens.rows.length === 0) {
        console.log('Token not found in database');
        return res.status(400).json({ error: 'Invalid token' });
      } else {
        const foundToken = allTokens.rows[0];
        console.log('Token details:', {
          used: foundToken.used,
          expires_at: foundToken.expires_at,
          now: new Date(),
          isExpired: new Date(foundToken.expires_at) < new Date()
        });
        
        if (foundToken.used) {
          console.log('Token has already been used');
          return res.status(400).json({ error: 'This link has already been used' });
        } else if (new Date(foundToken.expires_at) < new Date()) {
          console.log('Token has expired');
          return res.status(400).json({ error: 'This link has expired. Please request a new one.' });
        }
      }
      console.log('Token exists but findByToken returned null - unknown reason');
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    console.log('=== TOKEN IS VALID, PROCEEDING ===');
    console.log('Token record:', {
      email: tokenRecord.email,
      expires_at: tokenRecord.expires_at,
      used: tokenRecord.used
    });
    console.log('Token is valid, getting person for email:', tokenRecord.email);
    
    // Get person
    console.log('Calling Person.findByEmail...');
    const person = await Person.findByEmail(tokenRecord.email);
    console.log('Person.findByEmail returned:', person ? 'Found person' : 'null');
    
    if (!person) {
      console.log('Person not found for email:', tokenRecord.email);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Person found:', person.first_name, person.last_name);

    // Mark token as used
    console.log('Marking token as used...');
    await MagicLinkToken.markAsUsed(token);
    console.log('Token marked as used');

    // Create JWT
    console.log('Creating JWT token...');
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set!');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    const jwtToken = jwt.sign(
      { personId: person.id, email: person.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' } // 30 day session
    );
    console.log('JWT token created successfully');

    // Redirect to frontend with token
    // Use the request's origin to determine the correct frontend URL
    // If request came from mobile (IP address), use IP for frontend too
    const requestHost = req.get('host') || '';
    let frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    // If request came from IP address (not localhost), use IP for frontend
    if (requestHost.includes('192.168.') || requestHost.includes('10.') || requestHost.includes('172.')) {
      const ip = requestHost.split(':')[0];
      frontendUrl = `http://${ip}:5173`;
    }
    
    const redirectUrl = `${frontendUrl}/auth/callback?token=${jwtToken}`;
    console.log('Request host:', requestHost);
    console.log('Frontend URL:', frontendUrl);
    console.log('Redirecting to:', redirectUrl);
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Error verifying magic link:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

