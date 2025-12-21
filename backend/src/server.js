import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import householdsRoutes from './routes/households.js';
import personsRoutes from './routes/persons.js';
import preferencesRoutes from './routes/preferences.js';
import uploadRoutes from './routes/upload.js';
import { MagicLinkToken } from './models/MagicLinkToken.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// Allow CORS from localhost, local network IPs, and production domain
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://192.168.1.241:5173', // Add your local IP
  /^http:\/\/192\.168\.\d+\.\d+:5173$/, // Allow any 192.168.x.x IP
  /^http:\/\/10\.\d+\.\d+\.\d+:5173$/, // Allow any 10.x.x.x IP (common local network)
  // Add production domain patterns (both HTTP and HTTPS)
  process.env.NODE_ENV === 'production' && process.env.FRONTEND_URL 
    ? new RegExp(`^${process.env.FRONTEND_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`)
    : null,
  // Explicitly allow HTTPS version of production domain
  'https://neumanfam.com',
  'http://neumanfam.com',
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin matches any allowed pattern
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return origin === allowed;
      } else if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');
// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/households', householdsRoutes);
app.use('/api/persons', personsRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve static files from frontend build in production
if (process.env.NODE_ENV === 'production') {
  // Check for production path (public/) first, then development path (frontend/dist)
  const publicPath = path.join(__dirname, '..', 'public');
  const devPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
  const frontendPath = fs.existsSync(publicPath) ? publicPath : devPath;
  
  app.use(express.static(frontendPath));
  
  // Serve index.html for all non-API routes (SPA routing)
  app.get('*', (req, res, next) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// Cleanup expired tokens every hour
setInterval(async () => {
  try {
    await MagicLinkToken.cleanupExpired();
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
  }
}, 60 * 60 * 1000);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Accessible at http://localhost:${PORT} or http://192.168.1.241:${PORT}`);
});

