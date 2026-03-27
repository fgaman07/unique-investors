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

  // Fetch the entire sponsor chain in ONE query using a Recursive CTE
  const chainUsers: { id: string; sponsorId: string | null }[] = await prisma.$queryRaw`
    WITH RECURSIVE sponsors AS (
      SELECT id, "sponsorId", 0 as level FROM "User" WHERE id = ${agentId}
      UNION ALL
      SELECT u.id, u."sponsorId", s.level + 1 FROM "User" u
      JOIN sponsors s ON u.id = s."sponsorId"
      WHERE s.level < ${commissionPlan.length - 1}
    )
    SELECT id, "sponsorId" FROM sponsors ORDER BY level ASC;
  `;

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
