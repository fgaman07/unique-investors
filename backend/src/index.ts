import express, { Request, Response } from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';

import authRoutes from './modules/auth/auth.routes.js';
import inventoryRoutes from './modules/inventory/inventory.routes.js';
import salesRoutes from './modules/sales/sales.routes.js';
import mlmRoutes from './modules/mlm/mlm.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import settingsRoutes from './modules/settings/settings.routes.js';

const app = express();
const PORT = env.PORT;
const allowedOrigins = env.CLIENT_URL?.split(',').map((origin) => origin.trim()).filter(Boolean);

// Security & Parsing Middleware
app.use(cors({
  origin: allowedOrigins && allowedOrigins.length > 0 ? allowedOrigins : true,
  credentials: true,
}));
app.use(express.json());

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
      message: 'I&S BuildTech Backend API is running successfully.',
    });
  } catch (error) {
    res.status(503).json({
      status: 'Degraded',
      database: 'Disconnected',
      timestamp: new Date().toISOString(),
      message: 'API is running but the database connection failed.',
    });
  }
});

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`[Server] I&S BuildTech API running on http://localhost:${PORT}`);
});
