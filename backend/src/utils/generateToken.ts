import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const generateAccessToken = (id: string, role: string): string => {
  return jwt.sign({ id, role }, env.ACCESS_TOKEN_SECRET, {
    expiresIn: env.ACCESS_TOKEN_EXPIRY as any,
  });
};

export const generateRefreshToken = (id: string, role: string): string => {
  return jwt.sign({ id, role }, env.REFRESH_TOKEN_SECRET, {
    expiresIn: env.REFRESH_TOKEN_EXPIRY as any,
  });
};
