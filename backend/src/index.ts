import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';
import { logger } from './utils/logger.js';

import authRoutes from './modules/auth/auth.routes.js';
import inventoryRoutes from './modules/inventory/inventory.routes.js';
import salesRoutes from './modules/sales/sales.routes.js';
import mlmRoutes from './modules/mlm/mlm.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import settingsRoutes from './modules/settings/settings.routes.js';

const app = express();
const PORT = env.PORT;
const allowedOrigins = env.CLIENT_URL?.split(',').map((origin) => origin.trim()).filter(Boolean);

import rateLimit from 'express-rate-limit';

// Global API Rate Limiting (Standard)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // Limit each IP to 2000 requests per windowMs
  message: { message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict Auth Limiting (Login/Register/Refresh)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 auth requests per windowMs
  message: { message: 'Too many authentication attempts, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security & Parsing Middleware
app.use(helmet({ contentSecurityPolicy: false })); // CSP disabled for API-only server
app.use(cors({
  origin: allowedOrigins && allowedOrigins.length > 0 ? allowedOrigins : true,
  credentials: true,
}));
app.use(globalLimiter);
app.use('/api/auth', authLimiter); // Applies stricter limits specifically to auth routes
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Main Modular Routes
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/mlm', mlmRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);

// API Health Check
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'Operational',
      database: 'Connected',
      timestamp: new Date().toISOString(),
      message: 'Unique Investors Backend API is running successfully.',
    });
  } catch (error: any) {
    logger.error(`Database connection failed on health check: ${error.message}`, { stack: error.stack });
    res.status(503).json({
      status: 'Degraded',
      database: 'Disconnected',
      timestamp: new Date().toISOString(),
      message: 'API is running but the database connection failed.',
    });
  }
});

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global Error Handler — prevents unhandled errors from crashing the server
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(`[GlobalErrorHandler] ${err.message}`, { stack: err.stack });
  res.status(500).json({ message: 'An unexpected server error occurred.' });
});

// Start Server
const server = app.listen(PORT, () => {
  logger.info(`[Server] Unique Investors API running on http://localhost:${PORT}`);
});

// Graceful Shutdown
const shutdown = async (signal: string) => {
  logger.info(`[Server] ${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    logger.info('[Server] Database disconnected. Goodbye.');
    process.exit(0);
  });
  // Force exit after 10s if graceful shutdown hangs
  setTimeout(() => process.exit(1), 10_000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
