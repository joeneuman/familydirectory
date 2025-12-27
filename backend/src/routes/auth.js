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
      // Check if token exists but is expired
      const allTokens = await pool.query(
        'SELECT * FROM magic_link_tokens WHERE token = $1',
        [token]
      );
      
      console.log('Tokens found in database:', allTokens.rows.length);
      
      // Helper function to determine frontend URL
      const getFrontendUrl = () => {
        let frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const requestHost = req.get('host') || '';
        if (requestHost && !requestHost.includes('localhost')) {
          frontendUrl = `${req.protocol}://${requestHost.split(':')[0]}`;
        }
        return frontendUrl;
      };
      
      if (allTokens.rows.length === 0) {
        // Token not found in database - could be expired and cleaned up, or invalid
        // Check if token looks like a UUID (magic link tokens are UUIDs)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(token)) {
          // Looks like a valid UUID format - likely expired and cleaned up
          console.log('Token not found but looks like UUID - likely expired and cleaned up, redirecting to expired page');
          return res.redirect(`${getFrontendUrl()}/auth/expired`);
        } else {
          // Not a valid UUID format - invalid token
          console.log('Token not found and invalid format');
          return res.status(400).json({ error: 'Invalid token' });
        }
      } else {
        const foundToken = allTokens.rows[0];
        console.log('Token details:', {
          expires_at: foundToken.expires_at,
          now: new Date(),
          isExpired: new Date(foundToken.expires_at) < new Date()
        });
        
        if (new Date(foundToken.expires_at) < new Date()) {
          console.log('Token has expired');
          // Redirect to expired link page
          return res.redirect(`${getFrontendUrl()}/auth/expired`);
        }
      }
      console.log('Token exists but findByToken returned null - unknown reason');
      // For any other case, redirect to expired page for better UX
      return res.redirect(`${getFrontendUrl()}/auth/expired`);
    }

    console.log('=== TOKEN IS VALID, PROCEEDING ===');
    console.log('Token record:', {
      email: tokenRecord.email,
      expires_at: tokenRecord.expires_at
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

    // If no admins exist, make this person the first admin
    if (!person.is_admin) {
      const adminCheck = await pool.query(
        'SELECT COUNT(*) as count FROM persons WHERE is_admin = true'
      );
      const adminCount = parseInt(adminCheck.rows[0].count);
      
      if (adminCount === 0) {
        console.log('No admins found. Making first user an admin:', person.email);
        await Person.update(person.id, { is_admin: true });
        person.is_admin = true; // Update local object for JWT
      }
    }

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
    // Use multiple methods to determine the correct frontend URL
    // Priority: referer > origin > host header > request URL
    let frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    // Check referer (where the link was clicked from)
    const referer = req.get('referer') || req.headers.referer || '';
    // Check origin header
    const origin = req.get('origin') || req.headers.origin || '';
    // Check host header
    const requestHost = req.get('host') || '';
    // Check the actual request URL
    const requestUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    
    console.log('Referer:', referer);
    console.log('Origin:', origin);
    console.log('Request Host:', requestHost);
    console.log('Request URL:', requestUrl);
    
    // Extract IP from any of these sources
    let detectedIp = null;
    
    // Check referer first (most reliable for mobile clicks)
    if (referer) {
      const refererMatch = referer.match(/(\d+\.\d+\.\d+\.\d+)/);
      if (refererMatch) {
        detectedIp = refererMatch[1];
      }
    }
    
    // Check origin if referer didn't have IP
    if (!detectedIp && origin) {
      const originMatch = origin.match(/(\d+\.\d+\.\d+\.\d+)/);
      if (originMatch) {
        detectedIp = originMatch[1];
      }
    }
    
    // Check host header if still no IP
    if (!detectedIp && requestHost) {
      if (requestHost.includes('192.168.') || requestHost.includes('10.') || requestHost.includes('172.')) {
        detectedIp = requestHost.split(':')[0];
      }
    }
    
    // Check request URL as last resort
    if (!detectedIp && requestUrl) {
      const urlMatch = requestUrl.match(/(\d+\.\d+\.\d+\.\d+)/);
      if (urlMatch) {
        detectedIp = urlMatch[1];
      }
    }
    
    // If we detected an IP, use it for frontend URL
    // In production, don't append port 5173 (that's for dev server)
    if (detectedIp) {
      // Use the detected IP without port in production, or use FRONTEND_URL if set
      if (process.env.NODE_ENV === 'production' && process.env.FRONTEND_URL) {
        frontendUrl = process.env.FRONTEND_URL;
      } else if (process.env.NODE_ENV === 'production') {
        // Production without FRONTEND_URL set - use detected IP without port
        frontendUrl = `http://${detectedIp}`;
      } else {
        // Development - use port 5173
        frontendUrl = `http://${detectedIp}:5173`;
      }
      console.log('Detected IP from request:', detectedIp);
    }
    
    const redirectUrl = `${frontendUrl}/auth/callback?token=${jwtToken}`;
    console.log('Final Frontend URL:', frontendUrl);
    console.log('Redirecting to:', redirectUrl);
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Error verifying magic link:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

