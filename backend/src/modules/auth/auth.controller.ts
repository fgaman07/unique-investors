import { Prisma, UserRole, UserStatus } from '@prisma/client';
import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/authMiddleware.js';
import { prisma } from '../../lib/prisma.js';
import { generateAccessToken, generateRefreshToken } from '../../utils/generateToken.js';
import { comparePassword, hashPassword } from '../../utils/hashPassword.js';
import { env } from '../../config/env.js';
import jwt from 'jsonwebtoken';
import { logAudit } from '../../utils/auditLogger.js';

const baseUserSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email().optional().or(z.literal('')).transform((value) => value || undefined),
  password: z.string().min(6),
  mobile: z.string().trim().min(10),
  panNo: z.string().trim().optional().or(z.literal('')).transform((value) => value || undefined),
  address: z.string().trim().optional().or(z.literal('')).transform((value) => value || undefined),
  bankName: z.string().trim().optional().or(z.literal('')).transform((value) => value || undefined),
  accountNo: z.string().trim().optional().or(z.literal('')).transform((value) => value || undefined),
  ifscCode: z.string().trim().optional().or(z.literal('')).transform((value) => value || undefined),
  tdsPercentage: z.coerce.number().min(0).max(100).optional(),
  sponsorId: z.string().trim().optional().nullable(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
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
  address: z.string().trim().optional().nullable().or(z.literal('')),
  bankName: z.string().trim().optional().nullable().or(z.literal('')),
  accountNo: z.string().trim().optional().nullable().or(z.literal('')),
  ifscCode: z.string().trim().optional().nullable().or(z.literal('')),
  tdsPercentage: z.coerce.number().min(0).max(100).optional(),
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
  address: true,
  bankName: true,
  accountNo: true,
  ifscCode: true,
  tdsPercentage: true,
  role: true,
  status: true,
  rank: true,
  joiningDate: true,
  createdAt: true,
  sponsor: { select: { userId: true, name: true } },
} satisfies Prisma.UserSelect;

const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';

const setRefreshTokenCookie = (res: Response, token: string) => {
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

const normalizeOptionalValue = (value?: string | null) => {
  if (value === '' || value === undefined) {
    return undefined;
  }

  return value === null ? null : value.trim();
};

const generateUniqueUserId = async (): Promise<string> => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const suffix = `${Date.now().toString().slice(-5)}${Math.floor(Math.random() * 10)}`;
    const candidate = `uniqueinvestors${suffix}`;
    const existing = await prisma.user.findUnique({ where: { userId: candidate }, select: { id: true } });
    if (!existing) {
      return candidate;
    }
  }

  throw new Error('Unable to generate a unique userId');
};

const handleAuthSuccess = async (res: Response, user: any) => {
  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id, user.role);

  // Store refresh token in DB
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  setRefreshTokenCookie(res, refreshToken);

  return {
    id: user.id,
    userId: user.userId,
    name: user.name,
    role: user.role,
    status: user.status,
    token: accessToken,
  };
};

const findDuplicateUser = async (mobile: string, email?: string) =>
  prisma.user.findFirst({
    where: {
      OR: [
        { mobile },
        ...(email ? [{ email }] : []),
      ],
    },
    select: { id: true },
  });

export const register = async (req: Request, res: Response): Promise<void> => {
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
        address: payload.address,
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

    res.status(201).json(await handleAuthSuccess(res, user));
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.issues[0]?.message || 'Invalid registration payload' });
      return;
    }

    console.error('[Auth/Register] Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
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
        address: payload.address,
        bankName: payload.bankName,
        accountNo: payload.accountNo,
        ifscCode: payload.ifscCode,
        tdsPercentage: payload.tdsPercentage,
        status: payload.status || UserStatus.ACTIVE,
      },
      select: userSelect,
    });

    // For admin-created users, we don't log them in immediately (no cookie/token needed for current session)
    res.status(201).json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.issues[0]?.message || 'Invalid user payload' });
      return;
    }

    console.error('[Auth/CreateUser] Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
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

    res.json(await handleAuthSuccess(res, user));
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.issues[0]?.message || 'Invalid login payload' });
      return;
    }

    console.error('[Auth/Login] Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const targetUserId = req.user!.role === 'ADMIN' && req.query.targetUserId ? (req.query.targetUserId as string) : req.user!.id;
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: userSelect,
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('[Auth/Profile] Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, role, page, limit } = req.query;
    const pageNum = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 50));
    const where: Prisma.UserWhereInput = {};

    if (role) {
      where.role = role as UserRole;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { userId: { contains: search as string, mode: 'insensitive' } },
        { mobile: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          ...userSelect,
          _count: { select: { downline: true, sales: true, commissions: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ users, total: totalCount, page: pageNum, limit: pageSize, pages: Math.ceil(totalCount / pageSize) });
  } catch (error) {
    console.error('[Auth/GetUsers] Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const payload = updateUserSchema.parse(req.body);

    // Check for duplicate email/mobile on other users
    if (payload.email || payload.mobile) {
      const conditions: Prisma.UserWhereInput[] = [];
      if (payload.mobile) conditions.push({ mobile: payload.mobile });
      if (payload.email && payload.email !== '') conditions.push({ email: payload.email });
      if (conditions.length > 0) {
        const duplicate = await prisma.user.findFirst({
          where: { AND: [{ id: { not: id } }, { OR: conditions }] },
          select: { id: true },
        });
        if (duplicate) {
          res.status(400).json({ message: 'Another user with this mobile or email already exists' });
          return;
        }
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(payload.name && { name: payload.name }),
        ...(payload.mobile && { mobile: payload.mobile }),
        ...(payload.role && { role: payload.role }),
        ...(payload.rank && { rank: payload.rank }),
        ...(payload.status && { status: payload.status }),
        ...(payload.address !== undefined && { address: normalizeOptionalValue(payload.address) }),
        ...(payload.email !== undefined && { email: normalizeOptionalValue(payload.email) }),
        ...(payload.panNo !== undefined && { panNo: normalizeOptionalValue(payload.panNo) }),
        ...(payload.sponsorId !== undefined && { sponsorId: normalizeOptionalValue(payload.sponsorId) }),
        ...(payload.bankName !== undefined && { bankName: normalizeOptionalValue(payload.bankName) }),
        ...(payload.accountNo !== undefined && { accountNo: normalizeOptionalValue(payload.accountNo) }),
        ...(payload.ifscCode !== undefined && { ifscCode: normalizeOptionalValue(payload.ifscCode) }),
        ...(payload.tdsPercentage !== undefined && { tdsPercentage: payload.tdsPercentage }),
      },
      select: userSelect,
    });

    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.issues[0]?.message || 'Invalid user update payload' });
      return;
    }

    console.error('[Auth/UpdateUser] Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const updateUserStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status } = updateStatusSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id },
      data: { status },
      select: userSelect,
    });

    await logAudit({
      req,
      userId: req.user!.id,
      action: 'UPDATE_USER_STATUS',
      resource: 'User',
      resourceId: id,
      details: { newStatus: status },
    });

    res.json({ message: 'User status updated successfully', user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.issues[0]?.message || 'Invalid status payload' });
      return;
    }

    console.error('[Auth/UpdateUserStatus] Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const adminResetPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { newPassword } = z.object({ newPassword: z.string().min(6) }).parse(req.body);
    
    await prisma.user.update({
      where: { id },
      data: { password: await hashPassword(newPassword) },
    });

    await logAudit({
      req,
      userId: req.user!.id,
      action: 'ADMIN_RESET_PASSWORD',
      resource: 'User',
      resourceId: id,
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.issues[0]?.message || 'Invalid payload' });
      return;
    }
    console.error('[Auth/AdminResetPassword] Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// @desc    Change authenticated user's password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      res.status(400).json({ message: 'Current password is incorrect' });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { password: await hashPassword(newPassword) },
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.issues[0]?.message || 'Invalid password payload' });
      return;
    }
    console.error('[Auth/ChangePassword] Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// @desc    Update own profile (for regular users)
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const allowedUpdates = z.object({
      address: z.string().trim().optional().nullable().or(z.literal('')),
      bankName: z.string().trim().optional().nullable().or(z.literal('')),
      accountNo: z.string().trim().optional().nullable().or(z.literal('')),
      ifscCode: z.string().trim().optional().nullable().or(z.literal('')),
    });
    const payload = allowedUpdates.parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(payload.address !== undefined && { address: normalizeOptionalValue(payload.address) }),
        ...(payload.bankName !== undefined && { bankName: normalizeOptionalValue(payload.bankName) }),
        ...(payload.accountNo !== undefined && { accountNo: normalizeOptionalValue(payload.accountNo) }),
        ...(payload.ifscCode !== undefined && { ifscCode: normalizeOptionalValue(payload.ifscCode) }),
      },
      select: userSelect,
    });

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.issues[0]?.message || 'Invalid profile payload' });
      return;
    }
    console.error('[Auth/UpdateProfile] Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// @desc    Refresh Access Token
// @route   POST /api/auth/refresh
// @access  Public (uses cookie)
export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE_NAME];

    if (!refreshToken) {
      res.status(401).json({ message: 'Refresh token missing' });
      return;
    }

    const dbToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!dbToken || dbToken.expiresAt < new Date()) {
      res.status(401).json({ message: 'Invalid or expired refresh token' });
      return;
    }

    // Verify JWT
    try {
      const decoded = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET) as any;
      const accessToken = generateAccessToken(decoded.id, decoded.role);

      res.json({ token: accessToken });
    } catch (err) {
      res.status(401).json({ message: 'Invalid refresh token' });
    }
  } catch (error) {
    console.error('[Auth/Refresh] Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE_NAME];

    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }

    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('[Auth/Logout] Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
