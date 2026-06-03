const analysisService = require('../services/analysisService');
const historyService = require('../services/historyService');

const analyze = async (req, res) => {
    try {
        const result = analysisService.analyze(req.body);

        await historyService.saveHistory(result);

        res.json({ result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { analyze };