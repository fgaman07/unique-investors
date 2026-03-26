import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
export const generateAccessToken = (id, role) => {
    return jwt.sign({ id, role }, env.ACCESS_TOKEN_SECRET, {
        expiresIn: env.ACCESS_TOKEN_EXPIRY,
    });
};
export const generateRefreshToken = (id, role) => {
    return jwt.sign({ id, role }, env.REFRESH_TOKEN_SECRET, {
        expiresIn: env.REFRESH_TOKEN_EXPIRY,
    });
};
