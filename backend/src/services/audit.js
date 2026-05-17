const db = require('./db');

/**
 * Service to record actions for the audit trail.
 */
const logAction = async (userId, action, resourceType, resourceId = null, details = null) => {
    try {
        await db.run(
            `INSERT INTO Audit_Logs (user_id, action, resource_type, resource_id, details) 
             VALUES (?, ?, ?, ?, ?)`,
            [userId, action, resourceType, resourceId, details ? JSON.stringify(details) : null]
        );
        console.log(`[Audit Log] User ${userId} performed ${action} on ${resourceType} ${resourceId || ''}`);
    } catch (error) {
        console.error('Failed to write audit log:', error.message);
        // Senior SWE: In a production system, we might use a secondary logging mechanism (e.g., CloudWatch, ELK) 
        // if the primary DB logging fails.
    }
};

module.exports = {
    logAction
};
