import { prisma } from '../../lib/prisma.js';
// @desc    Get user's commission ledger
// @route   GET /api/mlm/commissions
// @access  Private
export const getCommissions = async (req, res) => {
    try {
        const userId = req.user.id;
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
        const userId = req.user.id;
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
        const userId = req.user.id;
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
        const rootId = req.query.rootId || req.user.id;
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
