import jwt from 'jsonwebtoken';
export const generateToken = (id, role) => {
    // Signs a new JWT token valid for 30 days
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};
