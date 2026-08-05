import express, { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import helmet from 'helmet';
import compression from 'compression';
import multer from 'multer';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import placeRoutes from './routes/placeRoutes';
import eventRoutes from './routes/eventRoutes';
import itineraryRoutes from './routes/itineraryRoutes';
import userRoutes from './routes/userRoutes';
import weatherRoutes from './routes/weatherRoutes';
import socialRoutes from './routes/socialMediaRoutes';

dotenv.config();

const app = express();
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
export const prisma = new PrismaClient({ adapter, log: ['error', 'warn'] });

// Configure Multer for file uploads
const upload = multer({ dest: 'uploads/' }); // Files will be stored in the 'uploads/' directory

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// API for file uploads
app.post('/api/upload', upload.single('image'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }
  // Return the path where the file is accessible. In a real app, you'd upload to S3/Cloudinary.
  // For local development, we'll serve it statically.
  res.json({ imageUrl: `/uploads/${req.file.filename}` });
});

const port = process.env.PORT || 3000;

// Enable HTTP response Gzip compression
app.use(compression());

// Configure permissive CORS first so preflight & cross-origin responses pass smoothly
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Configure helmet with cross-origin resource sharing enabled
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: false,
    contentSecurityPolicy: false,
  })
);

app.use(express.json());

// Request Logger Middleware
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.path}`, req.body);
  next();
});

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/places', placeRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/itinerary', itineraryRoutes);
app.use('/api/user', userRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/weather', weatherRoutes);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Pune Tour Guide API is running' });
});

// Serve static assets in production if frontend build exists
const distPath = path.join(__dirname, '../../dist');
const distExists = fs.existsSync(distPath);

if (process.env.NODE_ENV === 'production' && distExists) {
  app.use(express.static(distPath));
  
  // Catch-all route to serve the React SPA
  app.get(/.*/, (req: Request, res: Response) => {
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(distPath, 'index.html'));
    } else {
      res.status(404).json({ error: 'API endpoint not found' });
    }
  });
} else {
  // Catch-all welcome route for API-only setups
  app.get(/.*/, (req: Request, res: Response) => {
    if (req.path.startsWith('/api/')) {
      res.status(404).json({ error: 'API endpoint not found' });
    } else {
      res.send(`Pune Tour Guide API is running (${process.env.NODE_ENV === 'production' ? 'Production' : 'Development'} API-Only Mode)`);
    }
  });
}

// Only start HTTP server when NOT running as a Vercel serverless function
if (process.env.VERCEL !== '1') {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

export default app;
