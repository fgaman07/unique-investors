import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters long'),
  PORT: z.coerce.number().default(5000),
  CLIENT_URL: z.string().optional(),
});

export const env = envSchema.parse(process.env);
