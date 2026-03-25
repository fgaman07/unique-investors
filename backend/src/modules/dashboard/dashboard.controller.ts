import { Response } from 'express';
import { AuthRequest } from '../../middleware/authMiddleware.js';
import { prisma } from '../../lib/prisma.js';

// @desc    Get dashboard stats for logged-in agent 
// @route   GET /api/dashboard/stats
// @access  Private
export const getStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Total sales by this agent
    const sales = await prisma.sale.findMany({ where: { agentId: userId } });
    const totalSales = sales.length;
    const totalSaleAmount = sales.reduce((s, sale) => s + sale.totalAmount, 0);
    const totalCollected = sales.reduce((s, sale) => s + sale.paidAmount, 0);

    // Direct members (Level 1 downline)
    const directMembers = await prisma.user.count({ where: { sponsorId: userId } });

    // Total downline (all levels)
    const allUsers = await prisma.user.findMany({ select: { id: true, sponsorId: true } });
    let totalDownline = 0;
    const queue = [userId];
    const visited = new Set<string>();
    visited.add(userId);
    while (queue.length > 0) {
      const current = queue.shift()!;
      const children = allUsers.filter(u => u.sponsorId === current);
      for (const child of children) {
        if (!visited.has(child.id)) {
          visited.add(child.id);
          totalDownline++;
          queue.push(child.id);
        }
      }
    }

    // Commissions
    const commissions = await prisma.commissionLedger.findMany({ where: { userId } });
    const totalCommission = commissions.reduce((s, c) => s + c.amount, 0);
    const pendingCommission = commissions.filter(c => c.status === 'PENDING').reduce((s, c) => s + c.amount, 0);
    const releasedCommission = commissions.filter(c => c.status === 'RELEASED').reduce((s, c) => s + c.amount, 0);

    // User info
    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      select: { name: true, userId: true, rank: true, role: true, mobile: true, email: true, panNo: true, joiningDate: true }
    });

    res.json({
      user,
      totalSales,
      totalSaleAmount,
      totalCollected,
      directMembers,
      totalDownline,
      totalCommission,
      pendingCommission,
      releasedCommission
    });
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
    const totalUsers = await prisma.user.count();
    const totalAgents = await prisma.user.count({ where: { role: 'AGENT' } });
    const totalProjects = await prisma.project.count();
    const totalProperties = await prisma.property.count();
    const bookedProperties = await prisma.property.count({ where: { status: 'BOOKED' } });
    const pendingProperties = await prisma.property.count({ where: { status: 'PENDING' } });

    const allSales = await prisma.sale.findMany();
    const totalSaleAmount = allSales.reduce((s, sale) => s + sale.totalAmount, 0);
    const totalCollected = allSales.reduce((s, sale) => s + sale.paidAmount, 0);

    const allCommissions = await prisma.commissionLedger.findMany();
    const totalCommissions = allCommissions.reduce((s, c) => s + c.amount, 0);
    const pendingCommissions = allCommissions.filter(c => c.status === 'PENDING').reduce((s, c) => s + c.amount, 0);
    const releasedCommissions = allCommissions.filter(c => c.status === 'RELEASED').reduce((s, c) => s + c.amount, 0);

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

    res.json({
      totalUsers, totalAgents, totalProjects, totalProperties,
      bookedProperties, pendingProperties,
      totalSales: allSales.length, totalSaleAmount, totalCollected,
      totalCommissions, pendingCommissions, releasedCommissions,
      totalEMIs, paidEMIs,
      recentSales
    });
  } catch (error) {
    console.error('[Dashboard/AdminStats] Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
