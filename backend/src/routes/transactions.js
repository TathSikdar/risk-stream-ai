const express = require('express');
const router = express.Router();
const db = require('../services/db');
const ai = require('../services/ai');
const audit = require('../services/audit');
const { authorize } = require('../middleware/auth');

/**
 * @route GET /api/transactions
 * @desc  Fetch all pending transactions.
 * @access Compliance_Officer
 */
router.get('/', authorize(['Compliance_Officer', 'Admin']), async (req, res) => {
    try {
        const transactions = await db.query('SELECT * FROM Transactions ORDER BY transaction_date DESC');
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch transactions.' });
    }
});

/**
 * @route POST /api/transactions/:id/analyze
 * @desc  Trigger AI analysis for a specific transaction.
 * @access Compliance_Officer
 */
router.post('/:id/analyze', authorize(['Compliance_Officer']), async (req, res) => {
    const { id } = req.params;
    
    try {
        // 1. Fetch transaction from DB
        const transaction = await db.get('SELECT * FROM Transactions WHERE id = ?', [id]);
        
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found.' });
        }

        // 2. Call AI Engine
        const analysis = await ai.analyzeTransaction(transaction);

        // 3. Save Risk Assessment to DB
        await db.run(
            `INSERT INTO Risk_Assessments (transaction_id, risk_score, reasoning, sources_checked, status) 
             VALUES (?, ?, ?, ?, 'Completed')`,
            [id, analysis.risk_score, analysis.reasoning, JSON.stringify(analysis.sources_checked)]
        );

        // 4. Update Transaction status if risk is high
        if (analysis.risk_score >= 80) {
            await db.run('UPDATE Transactions SET status = "Flagged" WHERE id = ?', [id]);
        }

        // Audit Log: Triggered AI Analysis
        await audit.logAction(
            req.user.id, 
            'AI_ANALYZE_TRIGGERED', 
            'Transaction', 
            id, 
            { risk_score: analysis.risk_score }
        );

        res.json({
            message: 'Analysis completed successfully.',
            analysis
        });
    } catch (error) {
        console.error('Analysis Error:', error.message);
        res.status(500).json({ error: error.message || 'Failed to analyze transaction.' });
    }
});

module.exports = router;
