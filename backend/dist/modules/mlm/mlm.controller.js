import { prisma } from '../../lib/prisma.js';
// @desc    Get user's commission ledger
// @route   GET /api/mlm/commissions
// @access  Private
export const getCommissions = async (req, res) => {
    try {
        const userId = req.user.role === 'ADMIN' && req.query.targetUserId ? req.query.targetUserId : req.user.id;
        const { from, to, type, status } = req.query;
        const where = { userId };
        if (from || to) {
            where.createdAt = {};
            if (from)
                where.createdAt.gte = new Date(from);
            if (to)
                where.createdAt.lte = new Date(to);
        }
        if (type)
            where.incomeType = type;
        if (status)
            where.status = status;
        const commissions = await prisma.commissionLedger.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { name: true, userId: true } } }
        });
        const totalPending = commissions.filter(c => c.status === 'PENDING').reduce((s, c) => s + c.amount, 0);
        const totalReleased = commissions.filter(c => c.status === 'RELEASED').reduce((s, c) => s + c.amount, 0);
        res.json({ commissions, totalPending, totalReleased, total: totalPending + totalReleased });
    }
    catch (error) {
        console.error('[MLM/Commissions] Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
// @desc    Get all downline members recursively
// @route   GET /api/mlm/downline
// @access  Private
export const getDownline = async (req, res) => {
    try {
        const userId = req.user.role === 'ADMIN' && req.query.targetUserId ? req.query.targetUserId : req.user.id;
        const allUsers = await prisma.user.findMany({
            select: { id: true, userId: true, name: true, mobile: true, rank: true, role: true, sponsorId: true, joiningDate: true, createdAt: true }
        });
        // Recursive BFS to find all downline
        const downline = [];
        const queue = [userId];
        const visited = new Set();
        visited.add(userId);
        while (queue.length > 0) {
            const current = queue.shift();
            const children = allUsers.filter(u => u.sponsorId === current);
            for (const child of children) {
                if (!visited.has(child.id)) {
                    visited.add(child.id);
                    const level = getLevel(allUsers, child.id, userId);
                    downline.push({ ...child, level });
                    queue.push(child.id);
                }
            }
        }
        res.json({ downline, totalCount: downline.length });
    }
    catch (error) {
        console.error('[MLM/Downline] Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
// @desc    Get direct referrals only (Level 1)
// @route   GET /api/mlm/direct-members
// @access  Private
export const getDirectMembers = async (req, res) => {
    try {
        const userId = req.user.role === 'ADMIN' && req.query.targetUserId ? req.query.targetUserId : req.user.id;
        const members = await prisma.user.findMany({
            where: { sponsorId: userId },
            select: { id: true, userId: true, name: true, mobile: true, rank: true, role: true, joiningDate: true, createdAt: true }
        });
        res.json({ members, count: members.length });
    }
    catch (error) {
        console.error('[MLM/DirectMembers] Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
// @desc    Get MLM tree structure for visualization
// @route   GET /api/mlm/tree
// @access  Private
export const getTree = async (req, res) => {
    try {
        const targetUserId = req.user.role === 'ADMIN' && req.query.targetUserId ? req.query.targetUserId : req.user.id;
        const rootId = req.query.rootId || targetUserId;
        const allUsers = await prisma.user.findMany({
            select: { id: true, userId: true, name: true, rank: true, role: true, sponsorId: true, joiningDate: true }
        });
        const buildTree = (parentId, depth) => {
            if (depth > 10)
                return null; // Safety limit
            const children = allUsers.filter(u => u.sponsorId === parentId);
            const parent = allUsers.find(u => u.id === parentId);
            return {
                ...parent,
                children: children.map(c => buildTree(c.id, depth + 1)).filter(Boolean)
            };
        };
        const tree = buildTree(rootId, 0);
        res.json(tree);
    }
    catch (error) {
        console.error('[MLM/Tree] Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
// @desc    Admin: Get ALL commissions globally 
// @route   GET /api/mlm/all-commissions
// @access  Private/Admin
export const getAllCommissions = async (req, res) => {
    try {
        const { status, type, userId } = req.query;
        const where = {};
        if (status)
            where.status = status;
        if (type)
            where.incomeType = type;
        if (userId)
            where.userId = userId;
        const commissions = await prisma.commissionLedger.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { name: true, userId: true, mobile: true } } }
        });
        const totalPending = commissions.filter(c => c.status === 'PENDING').reduce((s, c) => s + c.amount, 0);
        const totalReleased = commissions.filter(c => c.status === 'RELEASED').reduce((s, c) => s + c.amount, 0);
        res.json({ commissions, totalPending, totalReleased });
    }
    catch (error) {
        console.error('[MLM/AllCommissions] Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
// @desc    Admin: Release a pending commission payment
// @route   PUT /api/mlm/commissions/:id/release
// @access  Private/Admin
export const releaseCommission = async (req, res) => {
    try {
        const id = req.params.id;
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
        res.json({ message: 'Commission released successfully', commission: updated });
    }
    catch (error) {
        console.error('[MLM/Release] Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
// Helper: calculate level depth between child and root
function getLevel(allUsers, childId, rootId) {
    let level = 0;
    let current = childId;
    while (current !== rootId && level < 20) {
        const user = allUsers.find((u) => u.id === current);
        if (!user || !user.sponsorId)
            break;
        current = user.sponsorId;
        level++;
    }
    return level;
}
// @desc    Get financial summary for current user (earnings, TDS, balance)
// @route   GET /api/mlm/summary
// @access  Private
export const getUserSummary = async (req, res) => {
    try {
        const userId = req.user.role === 'ADMIN' && req.query.targetUserId ? req.query.targetUserId : req.user.id;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { tdsPercentage: true, rank: true, name: true, userId: true },
        });
        const commissions = await prisma.commissionLedger.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
        const promotional = commissions.filter(c => c.incomeType === 'Promotional');
        const level = commissions.filter(c => c.incomeType !== 'Promotional');
        const promotionalTotal = promotional.reduce((s, c) => s + c.amount, 0);
        const levelTotal = level.reduce((s, c) => s + c.amount, 0);
        const totalEarning = promotionalTotal + levelTotal;
        const tdsRate = user?.tdsPercentage ?? 5;
        const tds = totalEarning * (tdsRate / 100);
        const releasedAmount = commissions.filter(c => c.status === 'RELEASED').reduce((s, c) => s + c.amount, 0);
        const balance = totalEarning - tds - releasedAmount;
        res.json({
            promotionalIncentive: promotionalTotal,
            levelIncentive: levelTotal,
            totalEarning,
            tds,
            tdsRate,
            releasedAmount,
            balance,
            totalCommissions: commissions.length,
        });
    }
    catch (error) {
        console.error('[MLM/Summary] Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
// @desc    Enhanced direct members with Bigger Leg calculation
// @route   GET /api/mlm/direct-members-with-volume
// @access  Private
export const getDirectMembersWithVolume = async (req, res) => {
    try {
        const userId = req.user.role === 'ADMIN' && req.query.targetUserId ? req.query.targetUserId : req.user.id;
        // Get all users (for recursive BFS)
        const allUsers = await prisma.user.findMany({
            select: { id: true, userId: true, name: true, mobile: true, rank: true, sponsorId: true, joiningDate: true },
        });
        // Get direct referrals
        const directMembers = allUsers.filter(u => u.sponsorId === userId);
        // For each direct member, calculate the total business volume in their leg
        const membersWithVolume = await Promise.all(directMembers.map(async (member) => {
            // Find all users in this leg (BFS from member)
            const legUsers = [];
            const queue = [member.id];
            const visited = new Set();
            visited.add(member.id);
            while (queue.length > 0) {
                const cur = queue.shift();
                legUsers.push(cur);
                const children = allUsers.filter(u => u.sponsorId === cur && !visited.has(u.id));
                for (const child of children) {
                    visited.add(child.id);
                    queue.push(child.id);
                }
            }
            // Sum up sale amounts for this leg
            const sales = await prisma.sale.findMany({
                where: { agentId: { in: legUsers } },
                select: { paidAmount: true },
            });
            const volume = sales.reduce((s, sale) => s + sale.paidAmount, 0);
            return {
                ...member,
                joiningDate: member.joiningDate,
                legSize: legUsers.length,
                businessVolume: volume,
            };
        }));
        // Flag the bigger leg
        const maxVolume = Math.max(...membersWithVolume.map(m => m.businessVolume), 0);
        const result = membersWithVolume.map(m => ({
            ...m,
            isBiggerLeg: m.businessVolume === maxVolume && maxVolume > 0,
        }));
        res.json({ members: result, count: result.length });
    }
    catch (error) {
        console.error('[MLM/DirectMembersVolume] Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
// @desc    Aggregate business volume (sale amount) grouped by each direct referral leg
// @route   GET /api/mlm/all-leg
// @access  Private
export const getAllLegReport = async (req, res) => {
    try {
        const userId = req.user.role === 'ADMIN' && req.query.targetUserId ? req.query.targetUserId : req.user.id;
        const { from, to } = req.query;
        const allUsers = await prisma.user.findMany({
            select: { id: true, userId: true, name: true, mobile: true, rank: true, sponsorId: true, joiningDate: true },
        });
        const directMembers = allUsers.filter(u => u.sponsorId === userId);
        const legsWithVolume = await Promise.all(directMembers.map(async (member) => {
            // BFS to collect all users in this leg
            const legUserIds = [];
            const queue = [member.id];
            const visited = new Set();
            visited.add(member.id);
            while (queue.length > 0) {
                const cur = queue.shift();
                legUserIds.push(cur);
                const children = allUsers.filter(u => u.sponsorId === cur && !visited.has(u.id));
                for (const child of children) {
                    visited.add(child.id);
                    queue.push(child.id);
                }
            }
            // Build date filter for sales
            const saleDateFilter = {};
            if (from)
                saleDateFilter.gte = new Date(from);
            if (to)
                saleDateFilter.lte = new Date(to);
            const salesWhere = { agentId: { in: legUserIds } };
            if (from || to)
                salesWhere.saleDate = saleDateFilter;
            const sales = await prisma.sale.findMany({
                where: salesWhere,
                select: { totalAmount: true, paidAmount: true },
            });
            const totalSaleAmount = sales.reduce((s, sale) => s + sale.totalAmount, 0);
            const totalPaidAmount = sales.reduce((s, sale) => s + sale.paidAmount, 0);
            return {
                legHead: { id: member.id, userId: member.userId, name: member.name, mobile: member.mobile, rank: member.rank },
                legSize: legUserIds.length,
                saleCount: sales.length,
                totalSaleAmount,
                totalPaidAmount,
            };
        }));
        // Mark the bigger leg (highest total sale amount)
        const maxVolume = Math.max(...legsWithVolume.map(l => l.totalSaleAmount), 0);
        const result = legsWithVolume.map(l => ({
            ...l,
            isBiggerLeg: l.totalSaleAmount === maxVolume && maxVolume > 0,
        }));
        res.json({ legs: result, totalLegs: result.length });
    }
    catch (error) {
        console.error('[MLM/AllLegReport] Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
