import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import authRouter from './routes/auth';
import vendorsRouter from './routes/vendors';
import inventoryItemsRouter from './routes/inventoryItems';
import documentsRouter from './routes/documents';
import settingsRouter from './routes/settings';

export const prisma = new PrismaClient();

const app = express();

// Ensure upload directory exists
fs.mkdirSync(config.uploadDir, { recursive: true });

// Middleware
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(config.uploadDir));

// Health check
app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/vendors', vendorsRouter);
app.use('/api/v1/inventory-items', inventoryItemsRouter);
app.use('/api/v1/documents', documentsRouter);
app.use('/api/v1/settings', settingsRouter);

// Error handler
app.use(errorHandler);

// Start server, connect DB async
const server = app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});

prisma
  .$connect()
  .then(() => console.log('Database connected'))
  .catch((err) => console.error('Database connection failed:', err));

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  server.close();
  await prisma.$disconnect();
  process.exit(0);
});
