import { prisma } from '../lib/prisma.js';
import { setCache, invalidateCache } from '../lib/redis.js';
import { logger } from './logger.js';

export const preWarmCaches = async () => {
  logger.info('[Cache Warmer] Booting up cache pre-hydration routine...');

  try {
    // 1. Prewarm Admin Stats (Global - Heaviest Query)
    logger.info('[Cache Warmer] Warming Admin Dashboard Stats...');
    const totalUsers = await prisma.user.count();
    const totalAgents = await prisma.user.count({ where: { role: 'AGENT' } });
    const totalProjects = await prisma.project.count();
    const totalProperties = await prisma.property.count();
    const bookedProperties = await prisma.property.count({ where: { status: 'BOOKED' } });

    const salesAgg = await prisma.sale.aggregate({
      _sum: { totalAmount: true, paidAmount: true },
    });

    const commGroups = await prisma.commissionLedger.groupBy({
      by: ['status'],
      _sum: { amount: true },
    });
    
    let pendingCommissions = 0;
    let releasedCommissions = 0;
    for (const g of commGroups) {
      if (g.status === 'PENDING') pendingCommissions = g._sum.amount || 0;
      if (g.status === 'RELEASED') releasedCommissions = g._sum.amount || 0;
    }

    const emis = await prisma.eMI.groupBy({
      by: ['status'],
      _count: true,
    });
    let totalEMIs = 0;
    let paidEMIs = 0;
    for (const emi of emis) {
      totalEMIs += emi._count;
      if (emi.status === 'PAID') paidEMIs = emi._count;
    }

    const recentSales = await prisma.sale.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        agent: { select: { name: true } },
        property: { select: { propertyNo: true, type: true } },
      },
    });

    const adminStats = {
      totalUsers,
      totalAgents,
      totalProjects,
      totalProperties,
      bookedProperties,
      totalSaleAmount: salesAgg._sum.totalAmount || 0,
      totalCollected: salesAgg._sum.paidAmount || 0,
      pendingCommissions,
      releasedCommissions,
      recentSales,
      totalEMIs,
      paidEMIs
    };

    await setCache('dashboard:admin_stats', adminStats, 300); // 5 mins
    logger.info('[Cache Warmer] Active! Admin Dashboard cached in RAM.');

    // 2. Prewarm Inventory Properties Loop (Global Query)
    logger.info('[Cache Warmer] Warming Master Inventory Matrix...');
    const properties = await prisma.property.findMany({
      take: 1000,
      orderBy: { propertyNo: 'asc' },
      include: {
        block: {
          select: { name: true, project: { select: { name: true } } }
        }
      }
    });

    // Hash lookup optimization for inventory endpoints
    await setCache(`inventory:properties:pg1:l1000`, properties, 300);

    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: { blocks: true },
    });
    await setCache('inventory:projects:all', projects, 300);

    logger.info('[Cache Warmer] Inventory successfully injected into node-RAM.');

  } catch (error) {
    logger.error('[Cache Warmer] Failed to preload caches:', error);
  }
};
