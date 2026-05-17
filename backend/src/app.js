const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const db = require('./services/db');
const audit = require('./services/audit');
const ai = require('./services/ai');

const bcrypt = require('bcrypt');

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

app.use('/api/transactions', transactionRoutes);
app.use('/api/stats', statsRoutes);

/**
 * @route POST /api/ingest
 * @desc  Simulated webhook for real-time transaction ingestion.
 *        Automatically triggers AI analysis for the new transaction.
 * @access System (API Key)
 */
app.post('/api/ingest', async (req, res) => {
    const { sender_name, receiver_name, amount, currency, description } = req.body;
    
    try {
        const result = await db.run(
            `INSERT INTO Transactions (sender_name, receiver_name, amount, currency, status, description) 
             VALUES (?, ?, ?, ?, 'Pending', ?)`,
            [sender_name, receiver_name, amount, currency, description]
        );

        const transactionId = result.id;

        // Audit Log: System Ingestion
        await audit.logAction(1, 'SYSTEM_INGESTION', 'Transaction', transactionId, { amount });

        // Senior SWE: Trigger AI Analysis Asynchronously
        // We don't 'await' this so the ingestion response remains fast.
        (async () => {
            try {
                console.log(`Auto-triggering AI Analysis for Transaction #${transactionId}`);
                const transaction = { id: transactionId, sender_name, receiver_name, amount, currency, description };
                const analysis = await ai.analyzeTransaction(transaction);

                // Save Risk Assessment
                await db.run(
                    `INSERT INTO Risk_Assessments (transaction_id, risk_score, reasoning, sources_checked, status) 
                     VALUES (?, ?, ?, ?, 'Completed')`,
                    [transactionId, analysis.risk_score, analysis.reasoning, JSON.stringify(analysis.sources_checked)]
                );

                // Auto-Flag if risk is high
                if (analysis.risk_score >= 80) {
                    await db.run('UPDATE Transactions SET status = "Flagged" WHERE id = ?', [transactionId]);
                    console.log(`Transaction #${transactionId} auto-flagged as HIGH RISK (${analysis.risk_score})`);
                }
            } catch (aiError) {
                console.error(`Automated Analysis failed for #${transactionId}:`, aiError.message);
            }
        })();

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
