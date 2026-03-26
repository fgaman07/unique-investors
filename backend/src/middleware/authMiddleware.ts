import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface AuthRequest extends Request {
  user?: { id: string; role: string };
}

// Middleware to protect routes (Requires valid JWT Agent/Admin Token)
export const protect = (req: AuthRequest, res: Response, next: NextFunction): void => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET) as { id: string, role: string };
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ message: 'Session Expired or Invalid Token' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

// Middleware restricting access to Admins Only
export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ message: 'Access Denied: Admin privileges required' });
  }
};
