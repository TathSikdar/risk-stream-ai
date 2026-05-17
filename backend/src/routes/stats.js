const express = require('express');
const router = express.Router();
const db = require('../services/db');
const { authorize } = require('../middleware/auth');

/**
 * @route GET /api/stats/dashboard
 * @desc  Fetch aggregated statistics for the compliance dashboard.
 * @access Compliance_Officer
 */
router.get('/dashboard', authorize(['Compliance_Officer', 'Admin', 'Analyst']), async (req, res) => {
    try {
        // 1. Total Transactions Count
        const totalTxns = await db.get('SELECT COUNT(*) as count FROM Transactions');
        
        // 2. Flagged Transactions Count
        const flaggedTxns = await db.get('SELECT COUNT(*) as count FROM Transactions WHERE status = "Flagged"');
        
        // 3. Total Volume (USD)
        const totalVolume = await db.get('SELECT SUM(amount) as sum FROM Transactions');
        
        // 4. Risk Distribution
        const riskDistribution = await db.query(`
            SELECT 
                CASE 
                    WHEN risk_score < 30 THEN 'Low'
                    WHEN risk_score < 70 THEN 'Medium'
                    ELSE 'High'
                END as risk_level,
                COUNT(*) as count
            FROM Risk_Assessments
            GROUP BY risk_level
        `);

        // 5. Recent Activity (Latest 5 assessments)
        const recentActivity = await db.query(`
            SELECT t.sender_name, t.receiver_name, r.risk_score, r.assessment_date
            FROM Risk_Assessments r
            JOIN Transactions t ON r.transaction_id = t.id
            ORDER BY r.assessment_date DESC
            LIMIT 5
        `);

        res.json({
            summary: {
                total_transactions: totalTxns.count,
                flagged_transactions: flaggedTxns.count,
                total_volume: totalVolume.sum || 0,
                pending_review: totalTxns.count - flaggedTxns.count // Simplified logic
            },
            risk_distribution: riskDistribution,
            recent_activity: recentActivity
        });
    } catch (error) {
        console.error('Stats Error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard statistics.' });
    }
});

module.exports = router;
