const db = require('./db');
const ai = require('./ai');
const audit = require('./audit');

/**
 * Shared logic to ingest a transaction and trigger its AI analysis.
 */
const processTransaction = async (data, triggerUserId = 1) => {
    const { sender_name, receiver_name, amount, currency, description } = data;
    
    // 1. Insert into DB
    const result = await db.run(
        `INSERT INTO Transactions (sender_name, receiver_name, amount, currency, status, description) 
         VALUES (?, ?, ?, ?, 'Pending', ?)`,
        [sender_name, receiver_name, amount, currency, description]
    );

    const transactionId = result.id;

    // 2. Audit Log
    await audit.logAction(triggerUserId, 'SYSTEM_INGESTION', 'Transaction', transactionId, { amount });

    // 3. Trigger Asynchronous AI Analysis
    (async () => {
        try {
            if (global.io) global.io.emit('TRANSACTION_UPDATE', { 
                type: 'INGESTED', 
                transactionId, 
                message: `New transaction discovered: #${transactionId}` 
            });

            if (global.io) global.io.emit('TRANSACTION_UPDATE', { 
                type: 'ANALYSIS_STARTED', 
                transactionId, 
                message: `Agent investigating #${transactionId}...` 
            });

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
            }

            if (global.io) global.io.emit('TRANSACTION_UPDATE', { 
                type: 'ANALYSIS_COMPLETED', 
                transactionId, 
                riskScore: analysis.risk_score,
                status: analysis.risk_score >= 80 ? 'Flagged' : 'Pending',
                message: `Analysis complete for #${transactionId}: ${analysis.risk_score}/100` 
            });

        } catch (aiError) {
            console.error(`Automated Analysis failed for #${transactionId}:`, aiError.message);
            if (global.io) global.io.emit('TRANSACTION_UPDATE', { 
                type: 'ERROR', 
                transactionId, 
                message: `AI Engine Error: ${aiError.message}` 
            });
        }
    })();

    return transactionId;
};

module.exports = {
    processTransaction
};
