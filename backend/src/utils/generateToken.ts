import jwt from 'jsonwebtoken';

export const generateToken = (id: string, role: string): string => {
  // Signs a new JWT token valid for 30 days
  return jwt.sign({ id, role }, process.env.JWT_SECRET as string, {
    expiresIn: '30d',
  });
};
