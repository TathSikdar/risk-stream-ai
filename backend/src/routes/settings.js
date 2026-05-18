const express = require('express');
const router = express.Router();
const db = require('../services/db');
const audit = require('../services/audit');
const { authorize } = require('../middleware/auth');

/**
 * @route GET /api/settings/targets
 * @desc  Fetch all targeted entities.
 */
router.get('/targets', authorize(['Compliance_Officer', 'Admin', 'Analyst']), async (req, res) => {
    try {
        const targets = await db.query('SELECT * FROM Targeted_Entities ORDER BY entity_name ASC');
        res.json(targets);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch targeted entities.' });
    }
});

/**
 * @route POST /api/settings/targets
 * @desc  Add a new entity to the surveillance watchlist.
 */
router.post('/targets', authorize(['Compliance_Officer', 'Admin']), async (req, res) => {
    const { entity_name, category } = req.body;
    
    try {
        const result = await db.run(
            'INSERT INTO Targeted_Entities (entity_name, category, added_by) VALUES (?, ?, ?)',
            [entity_name, category || 'General', req.user.id]
        );
        
        await audit.logAction(req.user.id, 'TARGET_ENTITY_ADDED', 'System', result.id, { entity_name });
        
        res.status(201).json({ id: result.id, entity_name, category: category || 'General' });
    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'This entity is already on the target list.' });
        }
        res.status(500).json({ error: 'Failed to add target entity.' });
    }
});

/**
 * @route DELETE /api/settings/targets/:id
 * @desc  Remove an entity from the surveillance watchlist.
 */
router.delete('/targets/:id', authorize(['Compliance_Officer', 'Admin']), async (req, res) => {
    const { id } = req.params;
    
    try {
        const result = await db.run('DELETE FROM Targeted_Entities WHERE id = ?', [id]);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Entity not found.' });
        }
        
        await audit.logAction(req.user.id, 'TARGET_ENTITY_REMOVED', 'System', id);
        
        res.json({ message: 'Entity removed from watchlist.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove target entity.' });
    }
});

/**
 * @route GET /api/settings/system
 * @desc  Fetch general system configuration.
 */
router.get('/system', authorize(['Admin']), async (req, res) => {
    res.json({
        llm_provider: process.env.LLM_PROVIDER || 'GEMINI',
        db_engine: process.env.DB_ENGINE || 'SQLITE',
        ai_engine_url: process.env.AI_ENGINE_URL,
        version: '1.2.0-PROTOTYPE'
    });
});

module.exports = router;
