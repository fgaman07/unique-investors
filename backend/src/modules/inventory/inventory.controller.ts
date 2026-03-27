import { Prisma, PropertyStatus, PropertyType } from '@prisma/client';
import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { getCache, setCache, invalidateCache } from '../../lib/redis.js';

const createProjectSchema = z.object({
  projectNo: z.string().trim().min(3),
  name: z.string().trim().min(3),
  directCommission: z.coerce.number().min(0).max(100).optional(),
  blocks: z.array(z.string().trim().min(1)).min(1),
});

const updateProjectSchema = z.object({
  projectNo: z.string().trim().min(3).optional(),
  name: z.string().trim().min(3).optional(),
  directCommission: z.coerce.number().min(0).max(100).optional().nullable(),
});

const createBlockSchema = z.object({
  projectId: z.string().trim().min(1),
  name: z.string().trim().min(1),
});

const createPropertySchema = z.object({
  propertyNo: z.string().trim().min(2),
  type: z.nativeEnum(PropertyType),
  sizeSqYards: z.coerce.number().positive(),
  ratePerSqYard: z.coerce.number().positive(),
  plc: z.coerce.number().min(0).default(0),
  dimension: z.string().trim().optional().or(z.literal('')).transform((value) => value || undefined),
  blockId: z.string().trim().min(1),
}).passthrough();

const updatePropertySchema = z.object({
  propertyNo: z.string().trim().min(2).optional(),
  type: z.nativeEnum(PropertyType).optional(),
  sizeSqYards: z.coerce.number().positive().optional(),
  ratePerSqYard: z.coerce.number().positive().optional(),
  plc: z.coerce.number().min(0).optional(),
  dimension: z.string().trim().optional().nullable().or(z.literal('')),
  status: z.nativeEnum(PropertyStatus).optional(),
  blockId: z.string().trim().min(1).optional(),
});

const calculateTotalAmount = (sizeSqYards: number, ratePerSqYard: number, plc: number) =>
  sizeSqYards * ratePerSqYard + plc;

export const createProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectNo, name, blocks, directCommission } = createProjectSchema.parse(req.body);

    const existingProject = await prisma.project.findUnique({ where: { projectNo } });
    if (existingProject) {
      res.status(400).json({ message: 'Project number already exists' });
      return;
    }

    const project = await prisma.project.create({
      data: {
        projectNo,
        name,
        directCommission,
        blocks: {
          create: Array.from(new Set(blocks.map((blockName) => blockName.trim().toUpperCase()))).map((blockName) => ({
            name: blockName,
          })),
        },
      },
      include: { blocks: true },
    });

    await invalidateCache('inventory:*');

    res.status(201).json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.issues[0]?.message || 'Invalid project payload' });
      return;
    }

    console.error('[Inventory/CreateProject] Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const updateProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const payload = updateProjectSchema.parse(req.body);

    const project = await prisma.project.update({
      where: { id },
      data: payload,
      include: { blocks: true },
    });

    await invalidateCache('inventory:*');

    res.json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.issues[0]?.message || 'Invalid project update payload' });
      return;
    }

    console.error('[Inventory/UpdateProject] Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const addBlock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, name } = createBlockSchema.parse(req.body);

    const block = await prisma.block.create({
      data: {
        projectId,
        name: name.toUpperCase(),
      },
    });

    await invalidateCache('inventory:*');

    res.status(201).json(block);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.issues[0]?.message || 'Invalid block payload' });
      return;
    }

    console.error('[Inventory/AddBlock] Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const { include } = req.query;
    const cacheKey = `inventory:projects:include_${include || 'none'}`;

    const cachedProjects = await getCache(cacheKey);
    if (cachedProjects) {
      res.json(cachedProjects);
      return;
    }

    const includeBlocks = include === 'blocks';

    const options = includeBlocks 
      ? {
          take: 200,
          orderBy: { createdAt: 'desc' as const },
          include: {
            blocks: {
              orderBy: { name: 'asc' as const },
              include: {
                properties: {
                  orderBy: { propertyNo: 'asc' as const },
                  select: {
                    id: true,
                    propertyNo: true,
                    type: true,
                    sizeSqYards: true,
                    ratePerSqYard: true,
                    plc: true,
                    totalAmount: true,
                    dimension: true,
                    status: true,
                    blockId: true,
                    sales: {
                      select: {
                        id: true,
                        receiptNo: true,
                        agent: { select: { name: true, userId: true } },
                      },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        }
      : {
          take: 200,
          orderBy: { createdAt: 'desc' as const },
          select: { 
            id: true, 
            name: true, 
            projectNo: true, 
            directCommission: true,
            blocks: { select: { id: true, name: true } }
          },
        };

    const projects = await prisma.project.findMany(options as any);

    await setCache(cacheKey, projects, 3600); // Cache for 1 hour

    res.json(projects);
  } catch (error) {
    console.error('[Inventory/GetProjects] Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const createProperty = async (req: Request, res: Response): Promise<void> => {
  try {
    const { propertyNo, type, sizeSqYards, ratePerSqYard, plc, dimension, blockId } = createPropertySchema.parse(req.body);

    const property = await prisma.property.create({
      data: {
        propertyNo,
        type,
        sizeSqYards,
        ratePerSqYard,
        plc,
        totalAmount: calculateTotalAmount(sizeSqYards, ratePerSqYard, plc),
        dimension,
        blockId,
      },
    });

    await invalidateCache('inventory:*');

    res.status(201).json(property);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.issues[0]?.message || 'Invalid property payload' });
      return;
    }

    console.error('[Inventory/CreateProperty] Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const updateProperty = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const payload = updatePropertySchema.parse(req.body);
    const existingProperty = await prisma.property.findUnique({ where: { id } });

    if (!existingProperty) {
      res.status(404).json({ message: 'Property not found' });
      return;
    }

    const sizeSqYards = payload.sizeSqYards ?? existingProperty.sizeSqYards;
    const ratePerSqYard = payload.ratePerSqYard ?? existingProperty.ratePerSqYard;
    const plc = payload.plc ?? existingProperty.plc;

    const property = await prisma.property.update({
      where: { id },
      data: {
        ...(payload.propertyNo && { propertyNo: payload.propertyNo }),
        ...(payload.type && { type: payload.type }),
        ...(payload.status && { status: payload.status }),
        ...(payload.blockId && { blockId: payload.blockId }),
        ...(payload.dimension !== undefined && { dimension: payload.dimension || null }),
        ...(payload.sizeSqYards !== undefined && { sizeSqYards }),
        ...(payload.ratePerSqYard !== undefined && { ratePerSqYard }),
        ...(payload.plc !== undefined && { plc }),
        totalAmount: calculateTotalAmount(sizeSqYards, ratePerSqYard, plc),
      },
    });

    await invalidateCache('inventory:*');

    res.json(property);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.issues[0]?.message || 'Invalid property update payload' });
      return;
    }

    console.error('[Inventory/UpdateProperty] Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getProperties = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, blockId, projectId } = req.query;
    
    // Using a predictable cache key pattern
    const cacheKey = `inventory:properties:status_${status || 'all'}:block_${blockId || 'all'}:proj_${projectId || 'all'}`;
    const cachedProps = await getCache(cacheKey);
    
    if (cachedProps) {
      res.json(cachedProps);
      return;
    }

    const where: Prisma.PropertyWhereInput = {};

    if (status) {
      where.status = status as PropertyStatus;
    }

    if (blockId) {
      where.blockId = blockId as string;
    }

    if (projectId) {
      where.block = { projectId: projectId as string };
    }

    const properties = await prisma.property.findMany({
      take: 500,
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        block: {
          select: {
            id: true,
            name: true,
            project: { select: { id: true, projectNo: true, name: true } },
          },
        },
        sales: {
          select: {
            id: true,
            receiptNo: true,
            agent: { select: { name: true, userId: true } },
          },
          take: 1,
        },
      },
    });

    await setCache(cacheKey, properties, 1800); // Local cache sets for 30mins

    res.json(properties);
  } catch (error) {
    console.error('[Inventory/GetProperties] Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
