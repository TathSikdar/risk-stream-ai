const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');

const JWT_SECRET = process.env.JWT_SECRET || 'risk_stream_ai_super_secret_key';

describe('RBAC Middleware & Security', () => {
    
    const generateToken = (role) => {
        return jwt.sign({ id: 1, username: 'testuser', role }, JWT_SECRET);
    };

    it('should deny access if no token is provided', async () => {
        const res = await request(app).get('/api/transactions');
        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBe('Authorization header missing.');
    });

    it('should deny access if token is invalid', async () => {
        const res = await request(app)
            .get('/api/transactions')
            .set('Authorization', 'Bearer invalid_token');
        expect(res.statusCode).toBe(401);
    });

    it('should deny access to restricted routes for unauthorized roles', async () => {
        // 'Analyst' role is NOT in ['Compliance_Officer', 'Admin'] for this route
        const token = generateToken('Analyst');
        const res = await request(app)
            .get('/api/transactions')
            .set('Authorization', `Bearer ${token}`);
        
        expect(res.statusCode).toBe(403);
        expect(res.body.error).toBe('Access denied: Insufficient permissions.');
    });

    it('should permit access for authorized roles', async () => {
        const token = generateToken('Compliance_Officer');
        const res = await request(app)
            .get('/api/transactions')
            .set('Authorization', `Bearer ${token}`);
        
        // Should not be 401 or 403. Success (200) or DB error (500) are both valid "permission" signals.
        expect(res.statusCode).not.toBe(401);
        expect(res.statusCode).not.toBe(403);
    });
});
