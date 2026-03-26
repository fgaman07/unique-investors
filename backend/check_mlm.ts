import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, userId: true, name: true, sponsorId: true }
  });

  console.log('--- USER HIERARCHY ---');
  users.forEach(u => {
    const sponsor = users.find(s => s.id === u.sponsorId);
    console.log(`Agent: ${u.name} (${u.userId}) [ID: ${u.id}] -> Sponsored By: ${sponsor ? sponsor.name + ' (' + sponsor.userId + ')' : 'NONE'}`);
  });

  const commissions = await prisma.commissionLedger.findMany({
    include: { user: true }
  });

  console.log('\n--- COMMISSIONS ---');
  commissions.forEach(c => {
    console.log(`User: ${c.user.name} | Amount: ${c.amount} | Type: ${c.incomeType}`);
  });

  const sales = await prisma.sale.findMany({
    include: { agent: true }
  });

  console.log('\n--- SALES ---');
  sales.forEach(s => {
    console.log(`Receipt: ${s.receiptNo} | Agent: ${s.agent.name} | Amount: ${s.totalAmount}`);
  });
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
