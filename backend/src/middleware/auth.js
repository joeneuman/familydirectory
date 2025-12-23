import jwt from 'jsonwebtoken';
import { Person } from '../models/Person.js';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // Verify person still exists
    const person = await Person.findById(decoded.personId);
    if (!person) {
      return res.status(403).json({ error: 'User not found' });
    }

    req.user = {
      id: decoded.personId,
      email: decoded.email,
      is_admin: person.is_admin || false,
    };
    next();
  });
}





