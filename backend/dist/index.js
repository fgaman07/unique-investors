import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
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
app.use(helmet({ contentSecurityPolicy: false })); // CSP disabled for API-only server
app.use(cors({
    origin: allowedOrigins && allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
}));
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
app.get('/api/health', async (_req, res) => {
    try {
        await prisma.$queryRaw `SELECT 1`;
        res.status(200).json({
            status: 'Operational',
            database: 'Connected',
            timestamp: new Date().toISOString(),
            message: 'Unique Investors Backend API is running successfully.',
        });
    }
    catch (error) {
        res.status(503).json({
            status: 'Degraded',
            database: 'Disconnected',
            timestamp: new Date().toISOString(),
            message: 'API is running but the database connection failed.',
        });
    }
});
// 404 Handler
app.use((_req, res) => {
    res.status(404).json({ message: 'Route not found' });
});
// Global Error Handler — prevents unhandled errors from crashing the server
app.use((err, _req, res, _next) => {
    console.error('[GlobalErrorHandler]', err.message, err.stack);
    res.status(500).json({ message: 'An unexpected server error occurred.' });
});
// Start Server
const server = app.listen(PORT, () => {
    console.log(`[Server] Unique Investors API running on http://localhost:${PORT}`);
});
// Graceful Shutdown
const shutdown = async (signal) => {
    console.log(`[Server] ${signal} received. Shutting down gracefully...`);
    server.close(async () => {
        await prisma.$disconnect();
        console.log('[Server] Database disconnected. Goodbye.');
        process.exit(0);
    });
    // Force exit after 10s if graceful shutdown hangs
    setTimeout(() => process.exit(1), 10_000);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
