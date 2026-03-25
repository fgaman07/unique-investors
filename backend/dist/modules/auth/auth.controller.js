import { UserRole, UserStatus } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { generateToken } from '../../utils/generateToken.js';
import { comparePassword, hashPassword } from '../../utils/hashPassword.js';
const baseUserSchema = z.object({
    name: z.string().trim().min(2),
    email: z.string().trim().email().optional().or(z.literal('')).transform((value) => value || undefined),
    password: z.string().min(6),
    mobile: z.string().trim().min(10),
    panNo: z.string().trim().optional().or(z.literal('')).transform((value) => value || undefined),
    sponsorId: z.string().trim().optional().nullable(),
});
const createUserSchema = baseUserSchema.extend({
    role: z.nativeEnum(UserRole).optional(),
    rank: z.string().trim().min(2).optional(),
    status: z.nativeEnum(UserStatus).optional(),
});
const loginSchema = z.object({
    userId: z.string().trim().min(1),
    password: z.string().min(1),
});
const updateUserSchema = z.object({
    name: z.string().trim().min(2).optional(),
    email: z.string().trim().email().optional().nullable().or(z.literal('')),
    mobile: z.string().trim().min(10).optional(),
    panNo: z.string().trim().optional().nullable().or(z.literal('')),
    role: z.nativeEnum(UserRole).optional(),
    rank: z.string().trim().min(2).optional(),
    sponsorId: z.string().trim().optional().nullable().or(z.literal('')),
    status: z.nativeEnum(UserStatus).optional(),
});
const updateStatusSchema = z.object({
    status: z.nativeEnum(UserStatus),
});
const userSelect = {
    id: true,
    userId: true,
    name: true,
    email: true,
    mobile: true,
    panNo: true,
    role: true,
    status: true,
    rank: true,
    joiningDate: true,
    createdAt: true,
    sponsor: { select: { userId: true, name: true } },
};
const buildAuthResponse = (user) => ({
    id: user.id,
    userId: user.userId,
    name: user.name,
    role: user.role,
    status: user.status,
    token: generateToken(user.id, user.role),
});
const normalizeOptionalValue = (value) => {
    if (value === '' || value === undefined) {
        return undefined;
    }
    return value === null ? null : value.trim();
};
const generateUniqueUserId = async () => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
        const suffix = `${Date.now().toString().slice(-5)}${Math.floor(Math.random() * 10)}`;
        const candidate = `isbuildtech${suffix}`;
        const existing = await prisma.user.findUnique({ where: { userId: candidate }, select: { id: true } });
        if (!existing) {
            return candidate;
        }
    }
    throw new Error('Unable to generate a unique userId');
};
const findDuplicateUser = async (mobile, email) => prisma.user.findFirst({
    where: {
        OR: [
            { mobile },
            ...(email ? [{ email }] : []),
        ],
    },
    select: { id: true },
});
export const register = async (req, res) => {
    try {
        const payload = baseUserSchema.parse(req.body);
        const duplicateUser = await findDuplicateUser(payload.mobile, payload.email);
        if (duplicateUser) {
            res.status(400).json({ message: 'User with this mobile number or email already exists' });
            return;
        }
        const user = await prisma.user.create({
            data: {
                userId: await generateUniqueUserId(),
                name: payload.name,
                email: payload.email,
                mobile: payload.mobile,
                panNo: payload.panNo,
                password: await hashPassword(payload.password),
                sponsorId: payload.sponsorId || null,
            },
            select: {
                id: true,
                userId: true,
                name: true,
                role: true,
                status: true,
            },
        });
        res.status(201).json(buildAuthResponse(user));
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ message: error.issues[0]?.message || 'Invalid registration payload' });
            return;
        }
        console.error('[Auth/Register] Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
export const createUser = async (req, res) => {
    try {
        const payload = createUserSchema.parse(req.body);
        const duplicateUser = await findDuplicateUser(payload.mobile, payload.email);
        if (duplicateUser) {
            res.status(400).json({ message: 'User with this mobile number or email already exists' });
            return;
        }
        const user = await prisma.user.create({
            data: {
                userId: await generateUniqueUserId(),
                name: payload.name,
                email: payload.email,
                mobile: payload.mobile,
                panNo: payload.panNo,
                password: await hashPassword(payload.password),
                sponsorId: payload.sponsorId || null,
                role: payload.role || UserRole.AGENT,
                rank: payload.rank || 'Associate',
                status: payload.status || UserStatus.ACTIVE,
            },
            select: userSelect,
        });
        res.status(201).json(user);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ message: error.issues[0]?.message || 'Invalid user payload' });
            return;
        }
        console.error('[Auth/CreateUser] Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
export const login = async (req, res) => {
    try {
        const { userId, password } = loginSchema.parse(req.body);
        const user = await prisma.user.findUnique({ where: { userId } });
        if (!user) {
            res.status(401).json({ message: 'Invalid login credentials' });
            return;
        }
        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) {
            res.status(401).json({ message: 'Invalid login credentials' });
            return;
        }
        if (user.status !== UserStatus.ACTIVE) {
            res.status(403).json({ message: 'Your account has been blocked. Please contact the administrator.' });
            return;
        }
        res.json(buildAuthResponse(user));
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ message: error.issues[0]?.message || 'Invalid login payload' });
            return;
        }
        console.error('[Auth/Login] Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
export const getProfile = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: userSelect,
        });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.json(user);
    }
    catch (error) {
        console.error('[Auth/Profile] Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
export const getAllUsers = async (req, res) => {
    try {
        const { search, role } = req.query;
        const where = {};
        if (role) {
            where.role = role;
        }
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { userId: { contains: search, mode: 'insensitive' } },
                { mobile: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }
        const users = await prisma.user.findMany({
            where,
            select: {
                ...userSelect,
                _count: { select: { downline: true, sales: true, commissions: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(users);
    }
    catch (error) {
        console.error('[Auth/GetUsers] Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
export const updateUser = async (req, res) => {
    try {
        const id = req.params.id;
        const payload = updateUserSchema.parse(req.body);
        const user = await prisma.user.update({
            where: { id },
            data: {
                ...(payload.name && { name: payload.name }),
                ...(payload.mobile && { mobile: payload.mobile }),
                ...(payload.role && { role: payload.role }),
                ...(payload.rank && { rank: payload.rank }),
                ...(payload.status && { status: payload.status }),
                ...(payload.email !== undefined && { email: normalizeOptionalValue(payload.email) }),
                ...(payload.panNo !== undefined && { panNo: normalizeOptionalValue(payload.panNo) }),
                ...(payload.sponsorId !== undefined && { sponsorId: normalizeOptionalValue(payload.sponsorId) }),
            },
            select: userSelect,
        });
        res.json({ message: 'User updated successfully', user });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ message: error.issues[0]?.message || 'Invalid user update payload' });
            return;
        }
        console.error('[Auth/UpdateUser] Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
export const updateUserStatus = async (req, res) => {
    try {
        const id = req.params.id;
        const { status } = updateStatusSchema.parse(req.body);
        const user = await prisma.user.update({
            where: { id },
            data: { status },
            select: userSelect,
        });
        res.json({ message: 'User status updated successfully', user });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ message: error.issues[0]?.message || 'Invalid status payload' });
            return;
        }
        console.error('[Auth/UpdateUserStatus] Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
