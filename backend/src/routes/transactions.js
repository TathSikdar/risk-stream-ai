const express = require('express');
const router = express.Router();
const db = require('../services/db');
const ai = require('../services/ai');
const audit = require('../services/audit');
const { authorize } = require('../middleware/auth');

const orchestrator = require('../services/orchestrator');

// Mock "External Banking Ledger" for the discovery scan
const EXTERNAL_LEDGER = [
    { sender_name: 'Huawei', receiver_name: 'Global Logistics', amount: 15000000.00, currency: 'USD', description: 'Telecom infrastructure equipment' },
    { sender_name: 'TSMC', receiver_name: 'Intel Corp', amount: 24000000.00, currency: 'USD', description: 'Wafer production payment - Q3' },
    { sender_name: 'ZTE Corp', receiver_name: 'Local Partner Y', amount: 500000.00, currency: 'USD', description: 'Software licensing fees' },
    { sender_name: 'ASML', receiver_name: 'Samsung Electronics', amount: 85000000.00, currency: 'USD', description: 'EUV Lithography machine delivery' },
    { sender_name: 'North Heavy Industries', receiver_name: 'Mining Group A', amount: 3200000.00, currency: 'USD', description: 'Heavy machinery export' },
    { sender_name: 'SMIC', receiver_name: 'Tech Corp Global', amount: 4500000.00, currency: 'USD', description: 'Advanced lithography equipment components' }
];

/**
 * @route GET /api/transactions
 * @desc  Fetch all pending transactions.
 * @access Compliance_Officer
 */
router.get('/', authorize(['Compliance_Officer', 'Admin']), async (req, res) => {
    try {
        const transactions = await db.query(`
            SELECT t.*, r.risk_score, r.reasoning, r.sources_checked
            FROM Transactions t
            LEFT JOIN Risk_Assessments r ON t.id = r.transaction_id
            ORDER BY t.transaction_date DESC
        `);
        
        // Parse the sources_checked JSON string for the frontend
        const formattedTransactions = transactions.map(t => ({
            ...t,
            analysis: t.risk_score !== null ? {
                risk_score: t.risk_score,
                reasoning: t.reasoning,
                sources_checked: JSON.parse(t.sources_checked || '[]')
            } : null
        }));

        res.json(formattedTransactions);
    } catch (error) {
        console.error('Fetch Transactions Error:', error);
        res.status(500).json({ error: 'Failed to fetch transactions.' });
    }
});

/**
 * @route POST /api/transactions/scan
 * @desc  Simulate a global scan of external ledgers to discover new transactions for targeted entities.
 * @access Compliance_Officer
 */
router.post('/scan', authorize(['Compliance_Officer', 'Admin']), async (req, res) => {
    console.log('[SCAN] Initiating global transaction discovery...');
    
    try {
        let discoveredCount = 0;
        
        // 1. Fetch user-defined targets from the database
        const dbTargets = await db.query('SELECT entity_name FROM Targeted_Entities');
        const targetNames = dbTargets.map(t => t.entity_name.toLowerCase());
        
        // 2. Filter external ledger for targeted entities
        // If no targets are defined in DB, we scan the whole external ledger as a default
        const filteredLedger = targetNames.length > 0 
            ? EXTERNAL_LEDGER.filter(txn => 
                targetNames.includes(txn.sender_name.toLowerCase()) || 
                targetNames.includes(txn.receiver_name.toLowerCase()))
            : EXTERNAL_LEDGER;

        for (const txn of filteredLedger) {
            // Check if transaction already exists in our local ledger
            const exists = await db.get(
                'SELECT id FROM Transactions WHERE sender_name = ? AND receiver_name = ? AND amount = ?',
                [txn.sender_name, txn.receiver_name, txn.amount]
            );
            
            if (!exists) {
                console.log(`[SCAN] New transaction discovered: ${txn.sender_name} -> ${txn.receiver_name}`);
                await orchestrator.processTransaction(txn, req.user.id);
                discoveredCount++;
            }
        }
        
        // Audit the scan action
        await audit.logAction(req.user.id, 'GLOBAL_SCAN_TRIGGERED', 'System', null, { 
            discovered_count: discoveredCount,
            target_count: targetNames.length
        });

        res.json({
            message: discoveredCount > 0 
                ? `Scan complete. Discovered ${discoveredCount} new transactions for your targeted entities.`
                : `Scan complete. No new transactions found for your targeted entities.`,
            discovered_count: discoveredCount
        });
    } catch (error) {
        console.error('Scan Error:', error);
        res.status(500).json({ error: 'Global scan failed.' });
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

/**
 * @route DELETE /api/transactions/:id
 * @desc  Remove a transaction and its associated data.
 * @access Admin
 */
router.delete('/:id', authorize(['Admin', 'Compliance_Officer']), async (req, res) => {
    const { id } = req.params;
    
    try {
        // Delete associated risk assessments first
        await db.run('DELETE FROM Risk_Assessments WHERE transaction_id = ?', [id]);
        
        // Delete the transaction
        const result = await db.run('DELETE FROM Transactions WHERE id = ?', [id]);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Transaction not found.' });
        }

        // Audit Log
        await audit.logAction(req.user.id, 'TRANSACTION_DELETED', 'Transaction', id);

        res.json({ message: 'Transaction removed successfully.' });
    } catch (error) {
        console.error('Delete Error:', error);
        res.status(500).json({ error: 'Failed to remove transaction.' });
    }
});

module.exports = router;
