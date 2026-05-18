const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const db = require('./services/db');
const audit = require('./services/audit');
const ai = require('./services/ai');

const bcrypt = require('bcrypt');

const orchestrator = require('./services/orchestrator');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'risk_stream_ai_super_secret_key';

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
const transactionRoutes = require('./routes/transactions');
const statsRoutes = require('./routes/stats');
const settingsRoutes = require('./routes/settings');

app.use('/api/transactions', transactionRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/settings', settingsRoutes);

/**
 * @route POST /api/ingest
 * @desc  Simulated webhook for real-time transaction ingestion.
 *        Automatically triggers AI analysis for the new transaction.
 * @access System (API Key)
 */
app.post('/api/ingest', async (req, res) => {
    try {
        const transactionId = await orchestrator.processTransaction(req.body);
        res.status(201).json({ 
            message: 'Transaction ingested and queued for AI analysis.', 
            transaction_id: transactionId 
        });
    } catch (error) {
        console.error('Ingestion Error:', error);
        res.status(500).json({ error: 'Ingestion failed.' });
    }
});

/**
 * @route POST /api/auth/login
 * @desc  Secure login using bcrypt and JWT.
 */
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const user = await db.get('SELECT * FROM Users WHERE username = ?', [username]);
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        // Senior SWE: Constant-time comparison using bcrypt
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        // Audit Log: User Login
        await audit.logAction(user.id, 'LOGIN', 'User', user.id);

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                full_name: user.full_name
            }
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Login failed.' });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'BFF' });
});

module.exports = app;
