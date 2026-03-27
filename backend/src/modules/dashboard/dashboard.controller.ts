import { Response } from 'express';
import { AuthRequest } from '../../middleware/authMiddleware.js';
import { prisma } from '../../lib/prisma.js';
import { getCache, setCache } from '../../lib/redis.js';

// @desc    Get dashboard stats for logged-in agent 
// @route   GET /api/dashboard/stats
// @access  Private
export const getStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const cacheKey = `dashboard:stats:${userId}`;

    const cachedStats = await getCache(cacheKey);
    if (cachedStats) {
      res.json(cachedStats);
      return;
    }

    // Total sales by this agent
    const salesAgg = await prisma.sale.aggregate({
      where: { agentId: userId },
      _count: true,
      _sum: { totalAmount: true, paidAmount: true }
    });
    const totalSales = salesAgg._count;
    const totalSaleAmount = salesAgg._sum.totalAmount || 0;
    const totalCollected = salesAgg._sum.paidAmount || 0;

    // Direct members (Level 1 downline)
    const directMembers = await prisma.user.count({ where: { sponsorId: userId } });

    // Total downline (all levels) - Optimized with Recursive CTE to prevent event-loop blocking
    const [{ count }]: any = await prisma.$queryRaw`
      WITH RECURSIVE downline AS (
        SELECT id FROM "User" WHERE "sponsorId" = ${userId}
        UNION ALL
        SELECT u.id FROM "User" u
        JOIN downline d ON u."sponsorId" = d.id
      )
      SELECT COUNT(*)::int as count FROM downline;
    `;
    const totalDownline = count || 0;

    // Commissions
    const commGroups = await prisma.commissionLedger.groupBy({
      by: ['status'],
      where: { userId },
      _sum: { amount: true }
    });
    let totalCommission = 0;
    let pendingCommission = 0;
    let releasedCommission = 0;
    
    for (const group of commGroups) {
      const amt = group._sum.amount || 0;
      totalCommission += amt;
      if (group.status === 'PENDING') pendingCommission += amt;
      if (group.status === 'RELEASED') releasedCommission += amt;
    }

    // User info
    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      select: { name: true, userId: true, rank: true, role: true, mobile: true, email: true, panNo: true, joiningDate: true }
    });

    const payload = {
      user,
      totalSales,
      totalSaleAmount,
      totalCollected,
      directMembers,
      totalDownline,
      totalCommission,
      pendingCommission,
      releasedCommission
    };

    await setCache(cacheKey, payload, 300); // Cache for 5 minutes

    res.json(payload);
  } catch (error) {
    console.error('[Dashboard/Stats] Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// @desc    Get admin-level global dashboard stats
// @route   GET /api/dashboard/admin-stats
// @access  Private/Admin
export const getAdminStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cacheKey = `dashboard:admin_stats`;

    const cachedStats = await getCache(cacheKey);
    if (cachedStats) {
      res.json(cachedStats);
      return;
    }

    const totalUsers = await prisma.user.count();
    const totalAgents = await prisma.user.count({ where: { role: 'AGENT' } });
    const totalProjects = await prisma.project.count();
    const totalProperties = await prisma.property.count();
    const bookedProperties = await prisma.property.count({ where: { status: 'BOOKED' } });
    const pendingProperties = await prisma.property.count({ where: { status: 'PENDING' } });

    const salesAgg = await prisma.sale.aggregate({
      _count: true,
      _sum: { totalAmount: true, paidAmount: true }
    });
    const totalSales = salesAgg._count;
    const totalSaleAmount = salesAgg._sum.totalAmount || 0;
    const totalCollected = salesAgg._sum.paidAmount || 0;

    const commGroups = await prisma.commissionLedger.groupBy({
      by: ['status'],
      _sum: { amount: true }
    });
    let totalCommissions = 0;
    let pendingCommissions = 0;
    let releasedCommissions = 0;
    
    for (const group of commGroups) {
      const amt = group._sum.amount || 0;
      totalCommissions += amt;
      if (group.status === 'PENDING') pendingCommissions += amt;
      if (group.status === 'RELEASED') releasedCommissions += amt;
    }

    const totalEMIs = await prisma.eMI.count();
    const paidEMIs = await prisma.eMI.count({ where: { status: 'PAID' } });

    // Recent sales (last 10)
    const recentSales = await prisma.sale.findMany({
      take: 10,
      orderBy: { saleDate: 'desc' },
      include: {
        agent: { select: { name: true, userId: true } },
        property: { select: { propertyNo: true, type: true } }
      }
    });

    const payload = {
      totalUsers, totalAgents, totalProjects, totalProperties,
      bookedProperties, pendingProperties,
      totalSales, totalSaleAmount, totalCollected,
      totalCommissions, pendingCommissions, releasedCommissions,
      totalEMIs, paidEMIs,
      recentSales
    };

    await setCache(cacheKey, payload, 60); // Cache for 1 minute for Admin

    res.json(payload);
  } catch (error) {
    console.error('[Dashboard/AdminStats] Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
