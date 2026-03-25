import { PropertyStatus, PropertyType } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
const createProjectSchema = z.object({
    projectNo: z.string().trim().min(3),
    name: z.string().trim().min(3),
    blocks: z.array(z.string().trim().min(1)).min(1),
});
const updateProjectSchema = z.object({
    projectNo: z.string().trim().min(3).optional(),
    name: z.string().trim().min(3).optional(),
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
});
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
const calculateTotalAmount = (sizeSqYards, ratePerSqYard, plc) => sizeSqYards * ratePerSqYard + plc;
export const createProject = async (req, res) => {
    try {
        const { projectNo, name, blocks } = createProjectSchema.parse(req.body);
        const existingProject = await prisma.project.findUnique({ where: { projectNo } });
        if (existingProject) {
            res.status(400).json({ message: 'Project number already exists' });
            return;
        }
        const project = await prisma.project.create({
            data: {
                projectNo,
                name,
                blocks: {
                    create: Array.from(new Set(blocks.map((blockName) => blockName.trim().toUpperCase()))).map((blockName) => ({
                        name: blockName,
                    })),
                },
            },
            include: { blocks: true },
        });
        res.status(201).json(project);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ message: error.issues[0]?.message || 'Invalid project payload' });
            return;
        }
        console.error('[Inventory/CreateProject] Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
export const updateProject = async (req, res) => {
    try {
        const id = req.params.id;
        const payload = updateProjectSchema.parse(req.body);
        const project = await prisma.project.update({
            where: { id },
            data: payload,
            include: { blocks: true },
        });
        res.json(project);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ message: error.issues[0]?.message || 'Invalid project update payload' });
            return;
        }
        console.error('[Inventory/UpdateProject] Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
export const addBlock = async (req, res) => {
    try {
        const { projectId, name } = createBlockSchema.parse(req.body);
        const block = await prisma.block.create({
            data: {
                projectId,
                name: name.toUpperCase(),
            },
        });
        res.status(201).json(block);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ message: error.issues[0]?.message || 'Invalid block payload' });
            return;
        }
        console.error('[Inventory/AddBlock] Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
export const getProjects = async (_req, res) => {
    try {
        const projects = await prisma.project.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                blocks: {
                    orderBy: { name: 'asc' },
                    include: {
                        properties: {
                            orderBy: { propertyNo: 'asc' },
                            include: {
                                sales: {
                                    include: {
                                        agent: { select: { name: true, userId: true } },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        res.json(projects);
    }
    catch (error) {
        console.error('[Inventory/GetProjects] Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
export const createProperty = async (req, res) => {
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
        res.status(201).json(property);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ message: error.issues[0]?.message || 'Invalid property payload' });
            return;
        }
        console.error('[Inventory/CreateProperty] Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
export const updateProperty = async (req, res) => {
    try {
        const id = req.params.id;
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
        res.json(property);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ message: error.issues[0]?.message || 'Invalid property update payload' });
            return;
        }
        console.error('[Inventory/UpdateProperty] Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
export const getProperties = async (req, res) => {
    try {
        const { status, blockId, projectId } = req.query;
        const where = {};
        if (status) {
            where.status = status;
        }
        if (blockId) {
            where.blockId = blockId;
        }
        if (projectId) {
            where.block = { projectId: projectId };
        }
        const properties = await prisma.property.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                block: { include: { project: true } },
                sales: {
                    include: {
                        agent: { select: { name: true, userId: true } },
                    },
                },
            },
        });
        res.json(properties);
    }
    catch (error) {
        console.error('[Inventory/GetProperties] Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
