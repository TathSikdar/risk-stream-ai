const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'risk_stream_ai_super_secret_key';

/**
 * Middleware to validate JWT and authorize based on role.
 */
const authorize = (allowedRoles = []) => {
    return (req, res, next) => {
        // For the prototype, if no auth header is present, we check if we're in 'dev' mode
        // In a real app, this would be strictly enforced.
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({ error: 'Authorization header missing.' });
        }

        const token = authHeader.split(' ')[1];
        
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;

            if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
                return res.status(403).json({ error: 'Access denied: Insufficient permissions.' });
            }

            next();
        } catch (error) {
            return res.status(401).json({ error: 'Invalid or expired token.' });
        }
    };
};

module.exports = {
    authorize
};
