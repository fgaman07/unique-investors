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

export const distributeCommissions = async (agentId: string, transactionAmount: number, receiptNo: string, customDirectCommission?: number | null): Promise<void> => {
  const commissionPlan = await getActiveCommissionPlan();

  // Pre-fetch the entire sponsor chain in ONE query instead of N sequential queries
  // Walk up the chain collecting user IDs, then batch-insert commissions
  const chainUsers: { id: string; sponsorId: string | null }[] = [];
  let currentId: string | null = agentId;

  // Fetch all needed users in a single query by walking the chain
  // We need at most commissionPlan.length users in the chain
  for (let i = 0; i < commissionPlan.length && currentId; i++) {
    const user = await prisma.user.findUnique({
      where: { id: currentId },
      select: { id: true, sponsorId: true },
    });
    if (!user) break;
    chainUsers.push(user);
    currentId = user.sponsorId;
  }

  // Batch-create all commission entries at once
  const commissionsToCreate = [];
  for (let i = 0; i < Math.min(commissionPlan.length, chainUsers.length); i++) {
    const slab = commissionPlan[i];
    const user = chainUsers[i];
    
    // Apply custom direct commission percentage for Level 1 if provided
    const percentage = (slab.level === 1 && customDirectCommission !== undefined && customDirectCommission !== null)
      ? customDirectCommission
      : slab.percentage;
      
    const amount = transactionAmount * (percentage / 100);
    if (amount > 0) {
      commissionsToCreate.push({
        userId: user.id,
        amount,
        incomeType: slab.label,
        remarks: `Commission from receipt ${receiptNo}`,
        status: 'PENDING' as const,
      });
    }
  }

  if (commissionsToCreate.length > 0) {
    await prisma.commissionLedger.createMany({ data: commissionsToCreate });
  }
};

export const rebuildCommissionLedger = async (): Promise<void> => {
  // Only delete PENDING commissions; RELEASED ones have already been paid out
  await prisma.commissionLedger.deleteMany({ where: { status: 'PENDING' } });

  const sales = await prisma.sale.findMany({
    orderBy: { saleDate: 'asc' },
    include: {
      property: { include: { block: { include: { project: true } } } },
      emis: {
        where: { status: 'PAID' },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  for (const sale of sales) {
    const customComm = sale.property?.block?.project?.directCommission;
    const emiTotal = sale.emis.reduce((sum: number, emi: { amount: number }) => sum + emi.amount, 0);
    const initialPayment = Math.max(sale.paidAmount - emiTotal, 0);

    if (initialPayment > 0) {
      await distributeCommissions(sale.agentId, initialPayment, sale.receiptNo, customComm);
    }

    for (const emi of sale.emis) {
      await distributeCommissions(sale.agentId, emi.amount, `${sale.receiptNo}-EMI-${emi.id.slice(0, 6)}`, customComm);
    }
  }
};
