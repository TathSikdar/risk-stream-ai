const axios = require('axios');

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';

/**
 * Triggers the Python LangGraph agent for transaction analysis.
 */
const analyzeTransaction = async (transaction) => {
    try {
        const response = await axios.post(`${AI_ENGINE_URL}/analyze`, {
            id: transaction.id,
            sender_name: transaction.sender_name,
            receiver_name: transaction.receiver_name,
            amount: transaction.amount,
            currency: transaction.currency,
            description: transaction.description
        });
        return response.data;
    } catch (error) {
        console.error('AI Engine Communication Error:', error.message);
        throw new Error('AI Engine is currently unavailable.');
    }
};

module.exports = {
    analyzeTransaction
};
