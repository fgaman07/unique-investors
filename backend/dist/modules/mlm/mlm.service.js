import { prisma } from '../../lib/prisma.js';
const defaultCommissionPlan = [
    { level: 1, label: 'Direct Sale Incentive', percentage: 10 },
    { level: 2, label: 'Level 2 Incentive', percentage: 5 },
    { level: 3, label: 'Level 3 Incentive', percentage: 3 },
    { level: 4, label: 'Level 4 Incentive', percentage: 2 },
    { level: 5, label: 'Level 5 Incentive', percentage: 1 },
];
export const getActiveCommissionPlan = async () => {
    const persistedPlan = await prisma.commissionSetting.findMany({
        where: { isActive: true },
        orderBy: { level: 'asc' },
    });
    return persistedPlan.length > 0 ? persistedPlan : defaultCommissionPlan;
};
export const distributeCommissions = async (agentId, transactionAmount, receiptNo) => {
    const commissionPlan = await getActiveCommissionPlan();
    let currentAgentId = agentId;
    for (const slab of commissionPlan) {
        if (!currentAgentId) {
            break;
        }
        const user = await prisma.user.findUnique({
            where: { id: currentAgentId },
            select: { id: true, sponsorId: true },
        });
        if (!user) {
            break;
        }
        const amount = transactionAmount * (slab.percentage / 100);
        if (amount > 0) {
            await prisma.commissionLedger.create({
                data: {
                    userId: user.id,
                    amount,
                    incomeType: slab.label,
                    remarks: `Commission from receipt ${receiptNo}`,
                    status: 'PENDING',
                },
            });
        }
        currentAgentId = user.sponsorId;
    }
};
export const rebuildCommissionLedger = async () => {
    // Only delete PENDING commissions; RELEASED ones have already been paid out
    await prisma.commissionLedger.deleteMany({ where: { status: 'PENDING' } });
    const sales = await prisma.sale.findMany({
        orderBy: { saleDate: 'asc' },
        include: {
            emis: {
                where: { status: 'PAID' },
                orderBy: { createdAt: 'asc' },
            },
        },
    });
    for (const sale of sales) {
        const emiTotal = sale.emis.reduce((sum, emi) => sum + emi.amount, 0);
        const initialPayment = Math.max(sale.paidAmount - emiTotal, 0);
        if (initialPayment > 0) {
            await distributeCommissions(sale.agentId, initialPayment, sale.receiptNo);
        }
        for (const emi of sale.emis) {
            await distributeCommissions(sale.agentId, emi.amount, `${sale.receiptNo}-EMI-${emi.id.slice(0, 6)}`);
        }
    }
};
