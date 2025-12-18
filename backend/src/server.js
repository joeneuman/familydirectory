import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import householdsRoutes from './routes/households.js';
import personsRoutes from './routes/persons.js';
import preferencesRoutes from './routes/preferences.js';
import { MagicLinkToken } from './models/MagicLinkToken.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
if (process.env.UPLOAD_DIR) {
  app.use('/uploads', express.static(path.join(__dirname, '..', process.env.UPLOAD_DIR)));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/households', householdsRoutes);
app.use('/api/persons', personsRoutes);
app.use('/api/preferences', preferencesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Cleanup expired tokens every hour
setInterval(async () => {
  try {
    await MagicLinkToken.cleanupExpired();
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
  }
}, 60 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

