import { Prisma, UserRole, UserStatus } from '@prisma/client';
import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/authMiddleware.js';
import { prisma } from '../../lib/prisma.js';
import { distributeCommissions } from '../mlm/mlm.service.js';

const createSaleSchema = z.object({
  receiptNo: z.string().trim().min(3),
  propertyId: z.string().trim().min(1),
  agentId: z.string().trim().min(1),
  paidAmount: z.coerce.number().min(0),
  saleDate: z.coerce.date().optional(),
});

const payEmiSchema = z.object({
  saleId: z.string().trim().min(1),
  amount: z.coerce.number().positive(),
});

export const createSale = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { receiptNo, propertyId, agentId, paidAmount, saleDate } = createSaleSchema.parse(req.body);

    const [property, agent] = await Promise.all([
      prisma.property.findUnique({ where: { id: propertyId } }),
      prisma.user.findUnique({ where: { id: agentId } }),
    ]);

    if (!property) {
      res.status(404).json({ message: 'Property not found' });
      return;
    }

    if (property.status !== 'PENDING') {
      res.status(400).json({ message: 'Property is already booked' });
      return;
    }

    if (!agent || agent.role === UserRole.ADMIN || agent.status !== UserStatus.ACTIVE) {
      res.status(400).json({ message: 'A valid active agent is required to create the sale' });
      return;
    }

    if (paidAmount > property.totalAmount) {
      res.status(400).json({ message: 'Paid amount cannot exceed the total property value' });
      return;
    }

    let sale;
    try {
      sale = await prisma.$transaction(async (tx) => {
        // Atomic update to lock and update simultaneously, preventing race conditions
        const updatedProperty = await tx.property.updateMany({
          where: { id: propertyId, status: 'PENDING' },
          data: { status: 'BOOKED' },
        });

        if (updatedProperty.count === 0) {
          throw new Error('PROPERTY_ALREADY_BOOKED');
        }

        return await tx.sale.create({
          data: {
            receiptNo,
            propertyId,
            agentId,
            totalAmount: property.totalAmount,
            paidAmount,
            saleDate,
          },
        });
      });
    } catch (txError: any) {
      if (txError.message === 'PROPERTY_ALREADY_BOOKED') {
        res.status(400).json({ message: 'Property is already booked by another simultaneous transaction' });
        return;
      }
      throw txError;
    }

    if (paidAmount > 0) {
      await distributeCommissions(agentId, paidAmount, receiptNo);
    }

    res.status(201).json({ message: 'Sale registered successfully', sale });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.issues[0]?.message || 'Invalid sale payload' });
      return;
    }

    console.error('[Sales/CreateSale] Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getSales = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { from, to, agentId } = req.query;
    const where: Prisma.SaleWhereInput = {};

    if (req.user!.role !== 'ADMIN') {
      where.agentId = req.user!.id;
    } else if (agentId) {
      where.agentId = agentId as string;
    }

    if (from || to) {
      where.saleDate = {};
      if (from) {
        where.saleDate.gte = new Date(from as string);
      }
      if (to) {
        where.saleDate.lte = new Date(to as string);
      }
    }

    const sales = await prisma.sale.findMany({
      where,
      orderBy: { saleDate: 'desc' },
      include: {
        property: {
          include: {
            block: {
              include: { project: true },
            },
          },
        },
        agent: { select: { name: true, userId: true } },
        emis: { orderBy: { createdAt: 'desc' } },
      },
    });

    res.json(sales);
  } catch (error) {
    console.error('[Sales/GetSales] Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getEMIs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { agentId } = req.query;
    const where: Prisma.EMIWhereInput = {};

    if (req.user!.role !== 'ADMIN') {
      where.sale = { agentId: req.user!.id };
    } else if (agentId) {
      where.sale = { agentId: agentId as string };
    }

    const emis = await prisma.eMI.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        sale: {
          include: {
            property: {
              select: {
                propertyNo: true,
                type: true,
                block: {
                  select: {
                    name: true,
                    project: { select: { name: true, projectNo: true } },
                  },
                },
              },
            },
            agent: { select: { name: true, userId: true } },
          },
        },
      },
    });

    res.json(emis);
  } catch (error) {
    console.error('[Sales/GetEmis] Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const payEMI = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { saleId, amount } = payEmiSchema.parse(req.body);
    const idempotencyKey = req.headers['x-idempotency-key'] as string | undefined;

    if (idempotencyKey) {
      try {
        await prisma.idempotencyRecord.create({
          data: { key: idempotencyKey, payload: req.body },
        });
      } catch (e: any) {
        if (e.code === 'P2002') { // Unique constraint violation
          res.status(409).json({ message: 'EMI calculation already processed for this transaction (Duplicate Request).' });
          return;
        }
        throw e;
      }
    }

    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { emis: true },
    });

    if (!sale) {
      res.status(404).json({ message: 'Sale not found' });
      return;
    }

    if (req.user!.role !== 'ADMIN' && sale.agentId !== req.user!.id) {
      res.status(403).json({ message: 'You are not allowed to register EMI for this sale' });
      return;
    }

    const outstandingAmount = sale.totalAmount - sale.paidAmount;
    if (amount > outstandingAmount) {
      res.status(400).json({ message: 'EMI amount cannot exceed the outstanding amount' });
      return;
    }

    const emi = await prisma.$transaction(async (tx) => {
      const createdEmi = await tx.eMI.create({
        data: {
          saleId,
          amount,
          paymentDate: new Date(),
          status: 'PAID',
        },
      });

      await tx.sale.update({
        where: { id: saleId },
        data: { paidAmount: sale.paidAmount + amount },
      });

      return createdEmi;
    });

    await distributeCommissions(sale.agentId, amount, `${sale.receiptNo}-EMI`);

    res.status(201).json({ message: 'EMI processed successfully', emi });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.issues[0]?.message || 'Invalid EMI payload' });
      return;
    }

    console.error('[Sales/PayEmi] Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
