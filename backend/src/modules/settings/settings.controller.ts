import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/authMiddleware.js';
import { logAudit } from '../../utils/auditLogger.js';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { rebuildCommissionLedger } from '../mlm/mlm.service.js';
import { getCache, setCache, invalidateCache } from '../../lib/redis.js';

const companySettingsSchema = z.object({
  companyName: z.string().trim().min(2),
  registrationNo: z.string().trim().optional().or(z.literal('')).transform((value) => value || undefined),
  address: z.string().trim().optional().or(z.literal('')).transform((value) => value || undefined),
  supportEmail: z.string().trim().email().optional().or(z.literal('')).transform((value) => value || undefined),
  contactNumber: z.string().trim().optional().or(z.literal('')).transform((value) => value || undefined),
}).passthrough();

const commissionSettingsSchema = z.object({
  settings: z.array(
    z.object({
      level: z.coerce.number().int().min(1).max(10),
      label: z.string().trim().min(3),
      percentage: z.coerce.number().min(0).max(100),
      isActive: z.boolean().optional().default(true),
    }),
  ).min(1),
});

const defaultCompanySettings = {
  companyName: 'Unique Investors Pvt. Ltd.',
  registrationNo: 'U70100DL2026PTC000000',
  address: '102, Dream Plaza, Highway Road, Delhi - 110001',
  supportEmail: 'support@uniqueinvestors.com',
  contactNumber: '+91-11-23456789',
};

const defaultCommissionSettings = [
  { level: 1, label: 'Direct Sale Incentive', percentage: 10, isActive: true },
  { level: 2, label: 'Level 2 Incentive', percentage: 5, isActive: true },
  { level: 3, label: 'Level 3 Incentive', percentage: 3, isActive: true },
  { level: 4, label: 'Level 4 Incentive', percentage: 2, isActive: true },
  { level: 5, label: 'Level 5 Incentive', percentage: 1, isActive: true },
];

const ensureCompanySettings = async () => {
  const existing = await prisma.companySettings.findFirst();
  if (existing) {
    return existing;
  }

  return prisma.companySettings.create({ data: defaultCompanySettings });
};

const ensureCommissionSettings = async () => {
  const existing = await prisma.commissionSetting.findMany({ orderBy: { level: 'asc' } });
  if (existing.length > 0) {
    return existing;
  }

  await prisma.commissionSetting.createMany({ data: defaultCommissionSettings });
  return prisma.commissionSetting.findMany({ orderBy: { level: 'asc' } });
};

export const getCompanySettings = async (_req: Request, res: Response): Promise<void> => {
  try {
    const cacheKey = 'settings:company';
    const cached = await getCache(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const settings = await ensureCompanySettings();
    await setCache(cacheKey, settings, 3600); // 1 hour
    res.json(settings);
  } catch (error) {
    console.error('[Settings/GetCompany] Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const updateCompanySettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const payload = companySettingsSchema.parse(req.body);
    const existing = await ensureCompanySettings();

    const { id: _id, ...updateData } = payload;
    const settings = await prisma.companySettings.update({
      where: { id: existing.id },
      data: updateData,
    });

    await logAudit({
      req,
      userId: req.user?.id,
      action: 'UPDATE_COMPANY_SETTINGS',
      resource: 'CompanySettings',
      resourceId: settings.id,
      details: updateData,
    });

    await invalidateCache('settings:company');
    res.json({ message: 'Company settings updated successfully', settings });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.issues[0]?.message || 'Invalid company settings payload' });
      return;
    }

    console.error('[Settings/UpdateCompany] Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getCommissionSettings = async (_req: Request, res: Response): Promise<void> => {
  try {
    const settings = await ensureCommissionSettings();
    res.json(settings);
  } catch (error) {
    console.error('[Settings/GetCommission] Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const updateCommissionSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { settings } = commissionSettingsSchema.parse(req.body);

    await prisma.$transaction(async (tx) => {
      await tx.commissionSetting.deleteMany();
      await tx.commissionSetting.createMany({
        data: settings
          .sort((left, right) => left.level - right.level)
          .map((setting) => ({
            level: setting.level,
            label: setting.label,
            percentage: setting.percentage,
            isActive: setting.isActive,
          })),
      });
    });

    const refreshed = await prisma.commissionSetting.findMany({ orderBy: { level: 'asc' } });

    await logAudit({
      req,
      userId: req.user?.id,
      action: 'UPDATE_COMMISSION_SETTINGS',
      resource: 'CommissionSettings',
      details: { updatedSettingsCount: settings.length },
    });

    res.json({ message: 'Commission settings updated successfully', settings: refreshed });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.issues[0]?.message || 'Invalid commission settings payload' });
      return;
    }

    console.error('[Settings/UpdateCommission] Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const recalculateCommissionLedger = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await ensureCommissionSettings();
    await rebuildCommissionLedger();

    await logAudit({
      req,
      userId: req.user?.id,
      action: 'RECALCULATE_COMMISSION_LEDGER',
      resource: 'CommissionLedger',
    });

    res.json({ message: 'Commission ledger recalculated successfully' });
  } catch (error) {
    console.error('[Settings/RecalculateLedger] Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
