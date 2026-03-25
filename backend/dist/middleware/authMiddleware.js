import jwt from 'jsonwebtoken';
// Middleware to protect routes (Requires valid JWT Agent/Admin Token)
export const protect = (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            next();
        }
        catch (error) {
            res.status(401).json({ message: 'Session Expired or Invalid Token' });
        }
    }
    else {
        res.status(401).json({ message: 'Not authorized, no token provided' });
    }
};
// Middleware restricting access to Admins Only
export const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    }
    else {
        res.status(403).json({ message: 'Access Denied: Admin privileges required' });
    }
};
