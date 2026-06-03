const historyService = require('../services/historyService');

const getHistory = async (req, res) => {
    try {
        const data = await historyService.getHistory();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getHistory };