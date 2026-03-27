import { LedgerStatus, Prisma } from '@prisma/client';
import { Response } from 'express';
import { AuthRequest } from '../../middleware/authMiddleware.js';
import { prisma } from '../../lib/prisma.js';
import { getCache, setCache, invalidateCache } from '../../lib/redis.js';

// @desc    Get user's commission ledger
// @route   GET /api/mlm/commissions
// @access  Private
export const getCommissions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.role === 'ADMIN' && req.query.targetUserId ? (req.query.targetUserId as string) : req.user!.id;
    const { from, to, type, status } = req.query;
    const cacheKey = `mlm:commissions:${userId}:${from || 's'}:${to || 'e'}:${type || 'a'}:${status || 'a'}`;

    const cached = await getCache(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const where: Prisma.CommissionLedgerWhereInput = { userId };
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from as string);
      if (to) where.createdAt.lte = new Date(to as string);
    }
    if (type) where.incomeType = type as string;
    if (status) where.status = status as LedgerStatus;

    const commissions = await prisma.commissionLedger.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, userId: true } } }
    });

    const totalPending = commissions.filter(c => c.status === 'PENDING').reduce((s, c) => s + c.amount, 0);
    const totalReleased = commissions.filter(c => c.status === 'RELEASED').reduce((s, c) => s + c.amount, 0);
    const result = { commissions, totalPending, totalReleased, total: totalPending + totalReleased };

    await setCache(cacheKey, result, 300);
    res.json(result);
  } catch (error) {
    console.error('[MLM/Commissions] Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// @desc    Get all downline members recursively
// @route   GET /api/mlm/downline
// @access  Private
export const getDownline = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.role === 'ADMIN' && req.query.targetUserId ? (req.query.targetUserId as string) : req.user!.id;
    const cacheKey = `mlm:downline:${userId}`;
    
    const cached = await getCache(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const allUsers = await prisma.user.findMany({
      select: { id: true, userId: true, name: true, mobile: true, rank: true, role: true, sponsorId: true, joiningDate: true, createdAt: true }
    });

    // Build lookup map for O(1) subset queries
    const childrenMap = new Map<string, typeof allUsers>();
    for (const u of allUsers) {
      if (u.sponsorId) {
        if (!childrenMap.has(u.sponsorId)) childrenMap.set(u.sponsorId, []);
        childrenMap.get(u.sponsorId)!.push(u);
      }
    }

    // Recursive BFS to find all downline
    const downline: any[] = [];
    const queue = [userId];
    const visited = new Set<string>();
    visited.add(userId);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const children = childrenMap.get(current) || [];
      for (const child of children) {
        if (!visited.has(child.id)) {
          visited.add(child.id);
          const level = getLevel(allUsers, child.id, userId);
          downline.push({ ...child, level });
          queue.push(child.id);
        }
      }
    }

    const result = { downline, totalCount: downline.length };
    await setCache(cacheKey, result, 300);
    res.json(result);
  } catch (error) {
    console.error('[MLM/Downline] Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// @desc    Get direct referrals only (Level 1)
// @route   GET /api/mlm/direct-members
// @access  Private
export const getDirectMembers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.role === 'ADMIN' && req.query.targetUserId ? (req.query.targetUserId as string) : req.user!.id;
    const members = await prisma.user.findMany({
      where: { sponsorId: userId },
      select: { id: true, userId: true, name: true, mobile: true, rank: true, role: true, joiningDate: true, createdAt: true }
    });
    res.json({ members, count: members.length });
  } catch (error) {
    console.error('[MLM/DirectMembers] Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// @desc    Get MLM tree structure for visualization
// @route   GET /api/mlm/tree
// @access  Private
export const getTree = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const targetUserId = req.user!.role === 'ADMIN' && req.query.targetUserId ? (req.query.targetUserId as string) : req.user!.id;
    const rootId = (req.query.rootId as string) || targetUserId;
    const allUsers = await prisma.user.findMany({
      select: { id: true, userId: true, name: true, rank: true, role: true, sponsorId: true, joiningDate: true }
    });

    const childrenMap = new Map<string, typeof allUsers>();
    for (const u of allUsers) {
      if (u.sponsorId) {
        if (!childrenMap.has(u.sponsorId)) childrenMap.set(u.sponsorId, []);
        childrenMap.get(u.sponsorId)!.push(u);
      }
    }

    const buildTree = (parentId: string, depth: number): any => {
      if (depth > 10) return null; // Safety limit
      const children = childrenMap.get(parentId) || [];
      const parent = allUsers.find(u => u.id === parentId);
      return {
        ...parent,
        children: children.map(c => buildTree(c.id, depth + 1)).filter(Boolean)
      };
    };

    const tree = buildTree(rootId, 0);
    res.json(tree);
  } catch (error) {
    console.error('[MLM/Tree] Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// @desc    Admin: Get ALL commissions globally 
// @route   GET /api/mlm/all-commissions
// @access  Private/Admin
export const getAllCommissions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, type, userId } = req.query;
    const where: Prisma.CommissionLedgerWhereInput = {};
    if (status) where.status = status as LedgerStatus;
    if (type) where.incomeType = type as string;
    if (userId) where.userId = userId as string;

    const commissions = await prisma.commissionLedger.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, userId: true, mobile: true } } }
    });

    const totalPending = commissions.filter(c => c.status === 'PENDING').reduce((s, c) => s + c.amount, 0);
    const totalReleased = commissions.filter(c => c.status === 'RELEASED').reduce((s, c) => s + c.amount, 0);

    res.json({ commissions, totalPending, totalReleased });
  } catch (error) {
    console.error('[MLM/AllCommissions] Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// @desc    Admin: Release a pending commission payment
// @route   PUT /api/mlm/commissions/:id/release
// @access  Private/Admin
export const releaseCommission = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const paymentMode = typeof req.body.paymentMode === 'string' ? req.body.paymentMode : undefined;
    const remarks = typeof req.body.remarks === 'string' ? req.body.remarks : undefined;

    const commission = await prisma.commissionLedger.findUnique({ where: { id } });
    if (!commission) {
      res.status(404).json({ message: 'Commission record not found' });
      return;
    }
    if (commission.status === 'RELEASED') {
      res.status(400).json({ message: 'Commission already released' });
      return;
    }

    const updated = await prisma.commissionLedger.update({
      where: { id },
      data: { status: 'RELEASED', paymentMode: paymentMode || 'NEFT', remarks: remarks || 'Released by Admin' }
    });

    // Invalidate caches
    await invalidateCache('mlm:commissions:*');
    await invalidateCache('dashboard:*');

    res.json({ message: 'Commission released successfully', commission: updated });
  } catch (error) {
    console.error('[MLM/Release] Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Helper: calculate level depth between child and root
function getLevel(allUsers: any[], childId: string, rootId: string): number {
  let level = 0;
  let current = childId;
  while (current !== rootId && level < 20) {
    const user = allUsers.find((u: any) => u.id === current);
    if (!user || !user.sponsorId) break;
    current = user.sponsorId;
    level++;
  }
  return level;
}

// @desc    Get financial summary for current user (earnings, TDS, balance)
// @route   GET /api/mlm/summary
// @access  Private
export const getUserSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.role === 'ADMIN' && req.query.targetUserId ? (req.query.targetUserId as string) : req.user!.id;
    const cacheKey = `mlm:summary:${userId}`;
    
    const cached = await getCache(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tdsPercentage: true, rank: true, name: true, userId: true },
    });

    const groupedInc = await prisma.commissionLedger.groupBy({
      by: ['incomeType'],
      where: { userId },
      _sum: { amount: true }
    });
    
    let promotionalTotal = 0;
    let levelTotal = 0;
    for (const g of groupedInc) {
      if (g.incomeType === 'Promotional') promotionalTotal += (g._sum.amount || 0);
      else levelTotal += (g._sum.amount || 0);
    }
    
    const groupedSt = await prisma.commissionLedger.groupBy({
      by: ['status'],
      where: { userId },
      _sum: { amount: true },
      _count: true
    });
    let releasedAmount = 0;
    let totalCommissionsCount = 0;
    for (const g of groupedSt) {
      totalCommissionsCount += g._count;
      if (g.status === 'RELEASED') releasedAmount += (g._sum.amount || 0);
    }

    const totalEarning = promotionalTotal + levelTotal;
    const tdsRate = user?.tdsPercentage ?? 5;
    const tds = totalEarning * (tdsRate / 100);
    const balance = totalEarning - tds - releasedAmount;
    const result = {
      promotionalIncentive: promotionalTotal,
      levelIncentive: levelTotal,
      totalEarning,
      tds,
      tdsRate,
      releasedAmount,
      balance,
      totalCommissions: totalCommissionsCount,
    };

    await setCache(cacheKey, result, 300);
    res.json(result);
  } catch (error) {
    console.error('[MLM/Summary] Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// @desc    Enhanced direct members with Bigger Leg calculation
// @route   GET /api/mlm/direct-members-with-volume
// @access  Private
export const getDirectMembersWithVolume = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.role === 'ADMIN' && req.query.targetUserId ? (req.query.targetUserId as string) : req.user!.id;
    const { from, to } = req.query;
    const cacheKey = `mlm:direct-volume:${userId}:${from || 's'}:${to || 'e'}`;
    
    const cached = await getCache(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    // Get all users (for recursive BFS)
    const allUsers = await prisma.user.findMany({
      select: { id: true, userId: true, name: true, mobile: true, rank: true, sponsorId: true, joiningDate: true },
    });

    // Get direct referrals
    const directMembers = allUsers.filter(u => u.sponsorId === userId);

    const childrenMap = new Map<string, typeof allUsers>();
    for (const u of allUsers) {
      if (u.sponsorId) {
        if (!childrenMap.has(u.sponsorId)) childrenMap.set(u.sponsorId, []);
        childrenMap.get(u.sponsorId)!.push(u);
      }
    }

    const saleGroups = await prisma.sale.groupBy({
      by: ['agentId'],
      _sum: { paidAmount: true },
    });
    const volumeMap = new Map<string, number>();
    for (const sg of saleGroups) {
      volumeMap.set(sg.agentId, sg._sum.paidAmount || 0);
    }

    // For each direct member, calculate the total business volume in their leg
    const membersWithVolume = directMembers.map((member) => {
      // Find all users in this leg (BFS from member)
      const legUsers: string[] = [];
      const queue = [member.id];
      const visited = new Set<string>();
      visited.add(member.id);

      let volume = 0;

      while (queue.length > 0) {
        const cur = queue.shift()!;
        legUsers.push(cur);
        volume += (volumeMap.get(cur) || 0);
        
        const children = childrenMap.get(cur) || [];
        for (const child of children) {
          if (!visited.has(child.id)) {
            visited.add(child.id);
            queue.push(child.id);
          }
        }
      }

      return {
        ...member,
        joiningDate: member.joiningDate,
        legSize: legUsers.length,
        businessVolume: volume,
      };
    });

    // Flag the bigger leg
    const maxVolume = Math.max(...membersWithVolume.map(m => m.businessVolume), 0);
    const result = membersWithVolume.map(m => ({
      ...m,
      isBiggerLeg: m.businessVolume === maxVolume && maxVolume > 0,
    }));

    res.json({ members: result, count: result.length });
  } catch (error) {
    console.error('[MLM/DirectMembersVolume] Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// @desc    Aggregate business volume (sale amount) grouped by each direct referral leg
// @route   GET /api/mlm/all-leg
// @access  Private
export const getAllLegReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.role === 'ADMIN' && req.query.targetUserId ? (req.query.targetUserId as string) : req.user!.id;
    const { from, to } = req.query;

    const allUsers = await prisma.user.findMany({
      select: { id: true, userId: true, name: true, mobile: true, rank: true, sponsorId: true, joiningDate: true },
    });

    const directMembers = allUsers.filter(u => u.sponsorId === userId);

    const childrenMap = new Map<string, typeof allUsers>();
    for (const u of allUsers) {
      if (u.sponsorId) {
        if (!childrenMap.has(u.sponsorId)) childrenMap.set(u.sponsorId, []);
        childrenMap.get(u.sponsorId)!.push(u);
      }
    }

    // Build date filter for sales
    const saleDateFilter: any = {};
    if (from) saleDateFilter.gte = new Date(from as string);
    if (to) saleDateFilter.lte = new Date(to as string);

    const saleGroups = await prisma.sale.groupBy({
      by: ['agentId'],
      where: (from || to) ? { saleDate: saleDateFilter } : undefined,
      _sum: { totalAmount: true, paidAmount: true },
      _count: true,
    });

    const legAggMap = new Map<string, { t: number, p: number, c: number }>();
    for (const sg of saleGroups) {
      legAggMap.set(sg.agentId, {
        t: sg._sum.totalAmount || 0,
        p: sg._sum.paidAmount || 0,
        c: sg._count,
      });
    }

    const legsWithVolume = directMembers.map((member) => {
      // BFS to collect all users in this leg
      const legUserIds: string[] = [];
      const queue = [member.id];
      const visited = new Set<string>();
      visited.add(member.id);

      let totalSaleAmount = 0;
      let totalPaidAmount = 0;
      let saleCount = 0;

      while (queue.length > 0) {
        const cur = queue.shift()!;
        legUserIds.push(cur);
        
        const agg = legAggMap.get(cur);
        if (agg) {
          totalSaleAmount += agg.t;
          totalPaidAmount += agg.p;
          saleCount += agg.c;
        }

        const children = childrenMap.get(cur) || [];
        for (const child of children) {
          if (!visited.has(child.id)) {
            visited.add(child.id);
            queue.push(child.id);
          }
        }
      }

      return {
        legHead: { id: member.id, userId: member.userId, name: member.name, mobile: member.mobile, rank: member.rank },
        legSize: legUserIds.length,
        saleCount: saleCount,
        totalSaleAmount,
        totalPaidAmount,
      };
    });

    // Mark the bigger leg (highest total sale amount)
    const maxVolume = Math.max(...legsWithVolume.map(l => l.totalSaleAmount), 0);
    const result = legsWithVolume.map(l => ({
      ...l,
      isBiggerLeg: l.totalSaleAmount === maxVolume && maxVolume > 0,
    }));

    const resultFinal = { legs: result, totalLegs: result.length };
    await setCache(cacheKey, resultFinal, 300);
    res.json(resultFinal);
  } catch (error) {
    console.error('[MLM/AllLegReport] Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// @desc    Admin: Create a custom manual incentive
// @route   POST /api/mlm/commissions/custom
// @access  Private/Admin
export const createCustomCommission = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, amount, incomeType, remarks } = req.body;

    if (!userId || !amount || !incomeType) {
      res.status(400).json({ message: 'Missing required fields: userId, amount, incomeType' });
      return;
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      res.status(404).json({ message: 'Target user not found' });
      return;
    }

    const commission = await prisma.commissionLedger.create({
      data: {
        userId,
        amount: Number(amount),
        incomeType,
        remarks: remarks || 'Manual Custom Incentive',
        status: 'PENDING'
      }
    });

    // Invalidate caches
    await invalidateCache('mlm:commissions:*');
    await invalidateCache('mlm:summary:*');
    await invalidateCache('dashboard:*');

    res.status(201).json({ message: 'Custom incentive created successfully', commission });
  } catch (error) {
    console.error('[MLM/CreateCustom] Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
