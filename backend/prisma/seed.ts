import { PrismaClient, PropertyType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedSettings() {
  await prisma.companySettings.upsert({
    where: { id: 'company-settings-default' },
    update: {},
    create: {
      id: 'company-settings-default',
      companyName: 'I&S Buildtech Pvt. Ltd.',
      registrationNo: 'U70100DL2026PTC000000',
      address: '102, Dream Plaza, Highway Road, Delhi - 110001',
      supportEmail: 'support@isbuildtech.com',
      contactNumber: '+91-11-23456789',
    },
  });

  const defaultCommissionPlan = [
    { level: 1, label: 'Direct Sale Incentive', percentage: 10, isActive: true },
    { level: 2, label: 'Level 2 Incentive', percentage: 5, isActive: true },
    { level: 3, label: 'Level 3 Incentive', percentage: 3, isActive: true },
    { level: 4, label: 'Level 4 Incentive', percentage: 2, isActive: true },
    { level: 5, label: 'Level 5 Incentive', percentage: 1, isActive: true },
  ];

  for (const slab of defaultCommissionPlan) {
    await prisma.commissionSetting.upsert({
      where: { level: slab.level },
      update: {
        label: slab.label,
        percentage: slab.percentage,
        isActive: slab.isActive,
      },
      create: slab,
    });
  }
}

async function main() {
  console.log('[Seed] Starting database seed...');
  const hashedPassword = await bcrypt.hash('admin123', 10);

  await seedSettings();

  const admin = await prisma.user.upsert({
    where: { userId: 'admin' },
    update: {},
    create: {
      userId: 'admin',
      name: 'Shri Kishan Kashyap',
      email: 'admin@isbuildtech.com',
      password: hashedPassword,
      mobile: '9999999999',
      panNo: 'ABCPK1234Z',
      role: 'ADMIN',
      rank: 'Director',
    },
  });

  const agent1 = await prisma.user.upsert({
    where: { userId: 'user123' },
    update: {},
    create: {
      userId: 'user123',
      name: 'Rajesh Kumar',
      email: 'rajesh@email.com',
      password: hashedPassword,
      mobile: '8888888888',
      panNo: 'BCDPR5678Y',
      role: 'AGENT',
      rank: 'Senior Manager',
      sponsorId: admin.id,
    },
  });

  const agent2 = await prisma.user.upsert({
    where: { userId: 'isbuildtech20001' },
    update: {},
    create: {
      userId: 'isbuildtech20001',
      name: 'Priya Sharma',
      email: 'priya@email.com',
      password: hashedPassword,
      mobile: '7777777777',
      panNo: 'CDEFG9012X',
      role: 'AGENT',
      rank: 'Manager',
      sponsorId: agent1.id,
    },
  });

  const agent3 = await prisma.user.upsert({
    where: { userId: 'isbuildtech20002' },
    update: {},
    create: {
      userId: 'isbuildtech20002',
      name: 'Amit Verma',
      email: 'amit@email.com',
      password: hashedPassword,
      mobile: '6666666666',
      panNo: 'DEFGH3456W',
      role: 'AGENT',
      rank: 'Associate',
      sponsorId: agent1.id,
    },
  });

  const agent4 = await prisma.user.upsert({
    where: { userId: 'isbuildtech20003' },
    update: {},
    create: {
      userId: 'isbuildtech20003',
      name: 'Sunita Devi',
      email: 'sunita@email.com',
      password: hashedPassword,
      mobile: '5555555555',
      panNo: 'EFGHI7890V',
      role: 'AGENT',
      rank: 'Associate',
      sponsorId: agent2.id,
    },
  });

  const agent5 = await prisma.user.upsert({
    where: { userId: 'isbuildtech20004' },
    update: {},
    create: {
      userId: 'isbuildtech20004',
      name: 'Vikram Singh',
      email: 'vikram@email.com',
      password: hashedPassword,
      mobile: '4444444444',
      panNo: 'FGHIJ2345U',
      role: 'AGENT',
      rank: 'Associate',
      sponsorId: agent2.id,
    },
  });

  const project = await prisma.project.upsert({
    where: { projectNo: 'PRJ-001' },
    update: {},
    create: {
      projectNo: 'PRJ-001',
      name: 'I&S Dream Homes Highway',
      blocks: {
        create: [{ name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D' }],
      },
    },
    include: { blocks: true },
  });

  const blocks = Object.fromEntries(project.blocks.map((block) => [block.name, block.id]));

  const propertyData = [
    { propertyNo: 'A-1', type: PropertyType.PLOT, sizeSqYards: 120, ratePerSqYard: 15000, plc: 0, dimension: '40x27', blockId: blocks.A },
    { propertyNo: 'A-2', type: PropertyType.PLOT, sizeSqYards: 150, ratePerSqYard: 15000, plc: 50000, dimension: '50x27', blockId: blocks.A },
    { propertyNo: 'A-3', type: PropertyType.PLOT, sizeSqYards: 100, ratePerSqYard: 15000, plc: 0, dimension: '33x27', blockId: blocks.A },
    { propertyNo: 'A-4', type: PropertyType.SHOP, sizeSqYards: 80, ratePerSqYard: 25000, plc: 100000, dimension: '20x36', blockId: blocks.A },
    { propertyNo: 'A-5', type: PropertyType.PLOT, sizeSqYards: 200, ratePerSqYard: 15000, plc: 75000, dimension: '66x27', blockId: blocks.A },
    { propertyNo: 'B-1', type: PropertyType.PLOT, sizeSqYards: 130, ratePerSqYard: 14000, plc: 0, dimension: '43x27', blockId: blocks.B },
    { propertyNo: 'B-2', type: PropertyType.PLOT, sizeSqYards: 160, ratePerSqYard: 14000, plc: 30000, dimension: '53x27', blockId: blocks.B },
    { propertyNo: 'B-3', type: PropertyType.SHOP, sizeSqYards: 90, ratePerSqYard: 22000, plc: 80000, dimension: '25x32', blockId: blocks.B },
    { propertyNo: 'B-4', type: PropertyType.PLOT, sizeSqYards: 110, ratePerSqYard: 14000, plc: 0, dimension: '37x27', blockId: blocks.B },
    { propertyNo: 'C-1', type: PropertyType.PLOT, sizeSqYards: 140, ratePerSqYard: 13000, plc: 0, dimension: '47x27', blockId: blocks.C },
    { propertyNo: 'C-2', type: PropertyType.PLOT, sizeSqYards: 180, ratePerSqYard: 13000, plc: 40000, dimension: '60x27', blockId: blocks.C },
    { propertyNo: 'C-3', type: PropertyType.SHOP, sizeSqYards: 70, ratePerSqYard: 20000, plc: 50000, dimension: '20x31', blockId: blocks.C },
    { propertyNo: 'D-1', type: PropertyType.PLOT, sizeSqYards: 100, ratePerSqYard: 12000, plc: 0, dimension: '33x27', blockId: blocks.D },
    { propertyNo: 'D-2', type: PropertyType.PLOT, sizeSqYards: 120, ratePerSqYard: 12000, plc: 20000, dimension: '40x27', blockId: blocks.D },
    { propertyNo: 'D-3', type: PropertyType.PLOT, sizeSqYards: 250, ratePerSqYard: 12000, plc: 100000, dimension: '83x27', blockId: blocks.D },
  ];

  for (const property of propertyData) {
    await prisma.property.upsert({
      where: { propertyNo: property.propertyNo },
      update: {},
      create: {
        ...property,
        totalAmount: property.sizeSqYards * property.ratePerSqYard + property.plc,
      },
    });
  }

  const saleFixtures = [
    { receiptNo: 'RCPT-10001', propertyNo: 'A-1', agentId: agent1.id, paidAmount: 500000, saleDate: new Date('2026-01-15') },
    { receiptNo: 'RCPT-10002', propertyNo: 'A-2', agentId: agent2.id, paidAmount: 800000, saleDate: new Date('2026-02-10') },
    { receiptNo: 'RCPT-10003', propertyNo: 'B-1', agentId: agent1.id, paidAmount: 600000, saleDate: new Date('2026-02-20') },
    { receiptNo: 'RCPT-10004', propertyNo: 'B-3', agentId: agent3.id, paidAmount: 1000000, saleDate: new Date('2026-03-01') },
    { receiptNo: 'RCPT-10005', propertyNo: 'C-1', agentId: agent4.id, paidAmount: 700000, saleDate: new Date('2026-03-10') },
  ];

  for (const fixture of saleFixtures) {
    const property = await prisma.property.findUnique({ where: { propertyNo: fixture.propertyNo } });
    if (!property) {
      continue;
    }

    await prisma.sale.upsert({
      where: { receiptNo: fixture.receiptNo },
      update: {},
      create: {
        receiptNo: fixture.receiptNo,
        propertyId: property.id,
        agentId: fixture.agentId,
        totalAmount: property.totalAmount,
        paidAmount: fixture.paidAmount,
        saleDate: fixture.saleDate,
      },
    });

    await prisma.property.update({
      where: { id: property.id },
      data: { status: 'BOOKED' },
    });
  }

  console.log('[Seed] Database seeded successfully');
  console.log('[Seed] Admin login -> userId: admin, password: admin123');
  console.log('[Seed] Agent login -> userId: user123, password: admin123');
  console.log(`[Seed] Extra users created: ${agent5.userId}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
